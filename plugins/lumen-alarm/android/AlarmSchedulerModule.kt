package __PACKAGE__.alarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManager

/** JS side: src/services/alarmScheduler.ts (NativeModules.AlarmScheduler). */
class AlarmSchedulerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AlarmScheduler"

    @ReactMethod
    fun scheduleAlarm(
        key: String,
        title: String,
        body: String,
        triggerAtMs: Double,
        timesOfDayMinutes: ReadableArray,
        daysOfWeek: ReadableArray,
        soundId: String?,
        promise: Promise,
    ) {
        try {
            AlarmStore.schedule(
                reactApplicationContext,
                AlarmStore.Spec(
                    key = key,
                    title = title,
                    body = body,
                    soundId = soundId ?: "default",
                    timesOfDayMinutes = IntArray(timesOfDayMinutes.size()) { timesOfDayMinutes.getInt(it) },
                    daysOfWeek = IntArray(daysOfWeek.size()) { daysOfWeek.getInt(it) },
                    triggerAtMs = triggerAtMs.toLong(),
                ),
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_SCHEDULE_ERROR", e.message, e)
        }
    }

    /** Cancels the reminder's alarm and any snooze of it. */
    @ReactMethod
    fun cancelAlarm(reminderId: String, promise: Promise) {
        try {
            AlarmStore.cancelReminder(reactApplicationContext, reminderId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelAllAlarms(promise: Promise) {
        try {
            AlarmStore.cancelAll(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelOrphanAlarms(activeReminderIds: ReadableArray, promise: Promise) {
        try {
            val active = (0 until activeReminderIds.size()).mapNotNull { activeReminderIds.getString(it) }.toSet()
            AlarmStore.cancelOrphans(reactApplicationContext, active)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCapabilities(promise: Promise) {
        val ctx = reactApplicationContext
        val am = ctx.getSystemService(AlarmManager::class.java)
        val nm = ctx.getSystemService(NotificationManager::class.java)
        promise.resolve(Arguments.createMap().apply {
            putBoolean("exactAlarmsAllowed", Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms())
            putBoolean(
                "fullScreenIntentAllowed",
                Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE || nm.canUseFullScreenIntent(),
            )
            putBoolean("overlayAllowed", Settings.canDrawOverlays(ctx))
            putBoolean("notificationsEnabled", nm.areNotificationsEnabled())
        })
    }

    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        openSettings(promise, Build.VERSION.SDK_INT >= Build.VERSION_CODES.S, Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
    }

    @ReactMethod
    fun openFullScreenIntentSettings(promise: Promise) {
        openSettings(
            promise,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE,
            Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
        )
    }

    /** "Appear on top": lets the alarm screen open over other apps, not just a popup banner. */
    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        openSettings(promise, true, Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
    }

    @ReactMethod
    fun getPendingAlarm(promise: Promise) {
        val id = pendingAlarmReminderId
        pendingAlarmReminderId = null
        promise.resolve(id)
    }

    /** Silences a ringing alarm (the in-app alarm screen calls this on Dismiss/Snooze/Complete). */
    @ReactMethod
    fun stopRingtone(promise: Promise) {
        try {
            AlarmService.stop(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_RINGTONE_ERROR", e.message, e)
        }
    }

    private fun openSettings(promise: Promise, supported: Boolean, action: String) {
        try {
            if (supported) {
                reactApplicationContext.startActivity(
                    Intent(action).apply {
                        data = Uri.parse("package:${reactApplicationContext.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    },
                )
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message, e)
        }
    }

    companion object {
        @JvmStatic
        @Volatile
        var pendingAlarmReminderId: String? = null
    }
}

class AlarmSchedulerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(AlarmSchedulerModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
