package __PACKAGE__.alarm

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule
import __PACKAGE__.MainActivity

/** Opening the app's own alarm screen (/alarm/[id]) after the member taps "Open Lumen". */
object AlarmIntents {
    private const val EXTRA_OPEN_ALARM = "openAlarm"
    private const val EXTRA_REMINDER_ID = "reminderId"
    const val EVENT = "LumenAlarmFired"

    fun openAppIntent(context: Context, reminderId: String): Intent =
        Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_OPEN_ALARM, true)
            putExtra(EXTRA_REMINDER_ID, reminderId)
        }

    /** Called from MainActivity.onCreate / onNewIntent (inserted by the config plugin). */
    fun handle(activity: Activity, intent: Intent?) {
        if (intent?.getBooleanExtra(EXTRA_OPEN_ALARM, false) != true) return
        val reminderId = intent.getStringExtra(EXTRA_REMINDER_ID) ?: return
        // Consumed once, so a later activity re-creation does not reopen the alarm screen.
        intent.removeExtra(EXTRA_OPEN_ALARM)

        // Cold start: JS reads this through getPendingAlarm() once it has mounted.
        AlarmSchedulerModule.pendingAlarmReminderId = reminderId

        // Warm start: tell the running JS directly, retrying until React is ready.
        val decor = activity.window.decorView
        var attempts = 0
        val emit = object : Runnable {
            override fun run() {
                attempts++
                val ctx = (activity.application as? ReactApplication)?.reactHost?.currentReactContext
                if (ctx != null && ctx.hasActiveReactInstance()) {
                    try {
                        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            ?.emit(EVENT, reminderId)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                } else if (attempts < 30) {
                    decor.postDelayed(this, 200)
                }
            }
        }
        decor.post(emit)
    }
}
