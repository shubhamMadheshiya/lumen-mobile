/**
 * Expo config plugin: native clock-style alarms for Lumen reminders on Android.
 *
 * `android/` is generated (and git-ignored), so EAS rebuilds it from app.config.js on every
 * build. Native code that only lives in android/ never reaches the APK; this plugin is how the
 * alarm code gets there. Kotlin sources live in ./lumen-alarm/android and are copied into the
 * app package on prebuild.
 *
 * Adds: AlarmManager scheduling that survives reboot, a foreground service that rings on the
 * ALARM audio stream (alarm volume), a native full-screen alarm screen over the lock screen,
 * and the NativeModules.AlarmScheduler bridge used by src/services/alarmScheduler.ts.
 */
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withMainActivity,
  withMainApplication,
} = require('expo/config-plugins');

const SOURCE_DIR = path.join(__dirname, 'lumen-alarm', 'android');
const MARKER = '// lumen-alarm';

const PERMISSIONS = [
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.SYSTEM_ALERT_WINDOW',
];

const COMPONENTS = {
  receiver: [
    { $: { 'android:name': '.alarm.AlarmReceiver', 'android:exported': 'false' } },
    {
      $: { 'android:name': '.alarm.AlarmBootReceiver', 'android:exported': 'true' },
      'intent-filter': [{
        action: [
          'android.intent.action.BOOT_COMPLETED',
          'android.intent.action.QUICKBOOT_POWERON',
          'android.intent.action.MY_PACKAGE_REPLACED',
          'android.intent.action.TIME_SET',
          'android.intent.action.TIMEZONE_CHANGED',
        ].map(name => ({ $: { 'android:name': name } })),
      }],
    },
  ],
  service: [
    {
      $: {
        'android:name': '.alarm.AlarmService',
        'android:exported': 'false',
        'android:foregroundServiceType': 'mediaPlayback',
      },
    },
  ],
  activity: [
    {
      $: {
        'android:name': '.alarm.AlarmActivity',
        'android:exported': 'false',
        'android:showWhenLocked': 'true',
        'android:turnScreenOn': 'true',
        'android:launchMode': 'singleInstance',
        'android:taskAffinity': '',
        'android:excludeFromRecents': 'true',
        'android:screenOrientation': 'portrait',
        'android:configChanges': 'orientation|screenSize|keyboardHidden',
        'android:theme': '@android:style/Theme.DeviceDefault.NoActionBar',
      },
    },
  ],
};

/** Names this plugin owns, plus the stale hand-added receiver from the old package. */
const OWNED_NAMES = new Set([
  '.AlarmReceiver',
  ...Object.values(COMPONENTS).flat().map(c => c.$['android:name']),
]);

function withAlarmSources(config) {
  return withDangerousMod(config, ['android', async cfg => {
    const pkg = cfg.android?.package;
    if (!pkg) throw new Error('[withLumenAlarm] android.package is required');
    const root = cfg.modRequest.platformProjectRoot;

    const javaDir = path.join(root, 'app', 'src', 'main', 'java', ...pkg.split('.'), 'alarm');
    fs.mkdirSync(javaDir, { recursive: true });
    for (const file of fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.kt'))) {
      const src = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8').replace(/__PACKAGE__/g, pkg);
      fs.writeFileSync(path.join(javaDir, file), src);
    }

    // The member's chosen tone is played natively on the alarm stream, so it has to be a raw resource.
    const soundsDir = path.join(cfg.modRequest.projectRoot, 'assets', 'sounds');
    const rawDir = path.join(root, 'app', 'src', 'main', 'res', 'raw');
    if (fs.existsSync(soundsDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
      for (const file of fs.readdirSync(soundsDir)) {
        const ext = path.extname(file).toLowerCase();
        if (!['.wav', '.mp3', '.ogg'].includes(ext)) continue;
        const name = path.basename(file, ext).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        fs.copyFileSync(path.join(soundsDir, file), path.join(rawDir, `lumen_alarm_${name}${ext}`));
      }
    }
    return cfg;
  }]);
}

function withAlarmManifest(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults;
    AndroidConfig.Permissions.ensurePermissions(manifest, PERMISSIONS);

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    for (const [tag, entries] of Object.entries(COMPONENTS)) {
      app[tag] = (app[tag] ?? []).filter(node => !OWNED_NAMES.has(node.$?.['android:name']));
      app[tag].push(...entries);
    }

    // The main app must not show over the lock screen (it holds health data); only the
    // dedicated AlarmActivity does. Clears flags an earlier hand edit added.
    const main = AndroidConfig.Manifest.getMainActivity(manifest);
    if (main?.$) {
      delete main.$['android:showWhenLocked'];
      delete main.$['android:turnScreenOn'];
    }
    return cfg;
  });
}

function withAlarmPackage(config) {
  return withMainApplication(config, cfg => {
    const pkg = cfg.android.package;
    let src = cfg.modResults.contents;
    if (!src.includes(MARKER)) {
      const anchor = /PackageList\(this\)\.packages\.apply\s*\{/;
      if (!anchor.test(src)) throw new Error('[withLumenAlarm] could not find PackageList in MainApplication');
      src = src.replace(anchor, m => `${m}\n          add(${pkg}.alarm.AlarmSchedulerPackage()) ${MARKER}`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

function withAlarmIntentHandling(config) {
  return withMainActivity(config, cfg => {
    const pkg = cfg.android.package;
    let src = cfg.modResults.contents;
    if (!src.includes(MARKER)) {
      // No trailing \s*: it would swallow the newline and put onCreate's closing brace after the comment.
      const onCreate = /(super\.onCreate\([^)]*\);?)/;
      const mainComponent = /(\n\s*\/\*\*[\s\S]*?\*\/\s*\n\s*override fun getMainComponentName)/;
      if (!onCreate.test(src) || !mainComponent.test(src)) {
        throw new Error('[withLumenAlarm] MainActivity layout changed; update withAlarmIntentHandling');
      }
      src = src.replace(onCreate, `$1\n    ${pkg}.alarm.AlarmIntents.handle(this, intent) ${MARKER}`);
      src = src.replace(
        mainComponent,
        `\n\n  override fun onNewIntent(intent: android.content.Intent) { ${MARKER}\n` +
        `    super.onNewIntent(intent)\n` +
        `    setIntent(intent)\n` +
        `    ${pkg}.alarm.AlarmIntents.handle(this, intent)\n` +
        `  }$1`,
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withLumenAlarm(config) {
  config = withAlarmSources(config);
  config = withAlarmManifest(config);
  config = withAlarmPackage(config);
  config = withAlarmIntentHandling(config);
  return config;
};
