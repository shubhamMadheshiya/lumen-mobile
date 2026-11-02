package __PACKAGE__.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fired by AlarmManager. Re-arms the next occurrence first, then starts the ringing service. */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val key = intent.getStringExtra(EXTRA_KEY) ?: return
        // Missing means it was cancelled after AlarmManager had already queued it.
        val spec = AlarmStore.get(context, key) ?: return
        AlarmStore.afterFired(context, spec)
        AlarmService.start(context, spec)
    }

    companion object {
        const val ACTION_FIRE = "lumen.alarm.FIRE:"
        const val EXTRA_KEY = "alarmKey"
    }
}

/** AlarmManager drops every alarm on reboot; some OEMs also drop them on app update or clock change. */
class AlarmBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED -> AlarmStore.rearmAll(context)
        }
    }
}
