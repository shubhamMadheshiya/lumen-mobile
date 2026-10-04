/**
 * scripts/patchAlarmManifest.js
 * Run after `expo prebuild` to add alarm-over-lock-screen attributes to MainActivity.
 * No extra dependencies needed — uses only Node.js built-ins.
 */
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.log('[patchAlarmManifest] AndroidManifest.xml not found — skipping (run after prebuild).');
  process.exit(0);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// Add showWhenLocked + turnScreenOn to MainActivity if not already present
if (!xml.includes('android:showWhenLocked')) {
  xml = xml.replace(
    /(<activity[^>]*android:name="\.MainActivity"[^>]*)(\/?>)/s,
    (match, activityTag, closing) => {
      const attrs = '\n        android:showWhenLocked="true"\n        android:turnScreenOn="true"';
      // If self-closing, convert to open tag
      if (closing === '/>') {
        return `${activityTag}${attrs}>`;
      }
      return `${activityTag}${attrs}${closing}`;
    }
  );
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('[patchAlarmManifest] ✅ Patched AndroidManifest.xml with showWhenLocked + turnScreenOn.');
} else {
  console.log('[patchAlarmManifest] Already patched — skipping.');
}
