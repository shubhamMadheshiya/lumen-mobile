package com.aifalabs.lumen

import android.os.Build
import android.os.Bundle
import android.content.Intent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme);
    super.onCreate(null)

    // Allow alarm notifications to wake screen and show over lock screen
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
      } else {
        @Suppress("DEPRECATION")
        window.addFlags(
          android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )
      }
    } catch (e: Exception) {}

    // Handle launch from AlarmReceiver full-screen intent
    handleAlarmIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleAlarmIntent(intent)
  }

  private fun handleAlarmIntent(intent: Intent?) {
    if (intent?.getBooleanExtra("openAlarm", false) == true) {
      val reminderId = intent.getStringExtra("reminderId") ?: return
      // Post to JS thread after React is ready
      window.decorView.post {
        try {
          val reactContext = (application as MainApplication)
            .reactNativeHost
            .reactInstanceManager
            .currentReactContext
          reactContext?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("LumenAlarmFired", reminderId)
        } catch (e: Exception) {
          // React not ready yet — the JS side will read getLastNotificationResponseAsync
        }
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
