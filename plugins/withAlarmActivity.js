/**
 * Expo config plugin: patches AndroidManifest.xml so the alarm screen
 * can display over the lock screen and turn the screen on — exactly like
 * a native clock alarm.
 *
 * Sets on MainActivity:
 *   android:showWhenLocked="true"   — display over lock screen
 *   android:turnScreenOn="true"     — wake the screen when alarm fires
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = withAndroidManifest(config => {
  const manifest = config.modResults;
  const app = manifest.manifest.application?.[0];
  if (!app) return config;

  const activities = app.activity ?? [];
  const mainActivity = activities.find(
    a => a.$?.['android:name'] === '.MainActivity'
  );

  if (mainActivity) {
    mainActivity.$['android:showWhenLocked'] = 'true';
    mainActivity.$['android:turnScreenOn'] = 'true';
  }

  return config;
});
