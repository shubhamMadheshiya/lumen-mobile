package __PACKAGE__.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import __PACKAGE__.MainActivity

/**
 * Source of truth for scheduled alarms. Every alarm is persisted so it can be re-armed after a
 * reboot or app update, and the receiver reads the latest title/sound from here when it fires.
 *
 * An alarm `key` is the reminder id, or "<reminderId>::snooze" for a snooze, so snoozing never
 * replaces the reminder's own next occurrence.
 */
object AlarmStore {
    private const val PREFS = "lumen_alarms"
    private const val PREFIX = "alarm_"
    const val SNOOZE_SUFFIX = "::snooze"

    data class Spec(
        val key: String,
        val title: String,
        val body: String,
        val soundId: String,
        val timesOfDayMinutes: IntArray,
        val daysOfWeek: IntArray,
        val triggerAtMs: Long,
    ) {
        val reminderId: String get() = key.substringBefore(SNOOZE_SUFFIX)
        val isRecurring: Boolean get() = timesOfDayMinutes.isNotEmpty()

        fun toJson(): String = JSONObject().apply {
            put("key", key)
            put("title", title)
            put("body", body)
            put("soundId", soundId)
            put("timesOfDayMinutes", JSONArray().also { a -> timesOfDayMinutes.forEach { a.put(it) } })
            put("daysOfWeek", JSONArray().also { a -> daysOfWeek.forEach { a.put(it) } })
            put("triggerAtMs", triggerAtMs)
        }.toString()

        companion object {
            fun fromJson(raw: String): Spec? = try {
                val o = JSONObject(raw)
                val t = o.optJSONArray("timesOfDayMinutes") ?: JSONArray()
                val d = o.optJSONArray("daysOfWeek") ?: JSONArray()
                Spec(
                    key = o.getString("key"),
                    title = o.optString("title", "Lumen reminder"),
                    body = o.optString("body", ""),
                    soundId = o.optString("soundId", "default"),
                    timesOfDayMinutes = IntArray(t.length()) { t.getInt(it) },
                    daysOfWeek = IntArray(d.length()) { d.getInt(it) },
                    triggerAtMs = o.optLong("triggerAtMs", 0L),
                )
            } catch (e: Exception) {
                null
            }
        }
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun get(context: Context, key: String): Spec? =
        prefs(context).getString(PREFIX + key, null)?.let { Spec.fromJson(it) }

    fun all(context: Context): List<Spec> =
        prefs(context).all.entries
            .filter { it.key.startsWith(PREFIX) }
            .mapNotNull { (it.value as? String)?.let { raw -> Spec.fromJson(raw) } }

    /** Persists the alarm and hands it to AlarmManager. */
    fun schedule(context: Context, spec: Spec) {
        prefs(context).edit().putString(PREFIX + spec.key, spec.toJson()).apply()
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val fire = firePendingIntent(context, spec.key)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
            // "Alarms & reminders" access was revoked: still deliver, possibly a little late.
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, spec.triggerAtMs, fire)
        } else {
            // setAlarmClock is exempt from Doze and app-standby limits, including on Samsung.
            am.setAlarmClock(AlarmManager.AlarmClockInfo(spec.triggerAtMs, showPendingIntent(context)), fire)
        }
    }

    fun cancel(context: Context, key: String) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(firePendingIntent(context, key))
        prefs(context).edit().remove(PREFIX + key).apply()
    }

    /** Cancels a reminder's own alarm and any pending snooze of it. */
    fun cancelReminder(context: Context, reminderId: String) {
        cancel(context, reminderId)
        cancel(context, reminderId + SNOOZE_SUFFIX)
    }

    fun cancelAll(context: Context) {
        all(context).forEach { cancel(context, it.key) }
    }

    fun cancelOrphans(context: Context, activeReminderIds: Set<String>) {
        all(context).filter { it.reminderId !in activeReminderIds && it.reminderId != "test_alarm" }
            .forEach { cancel(context, it.key) }
    }

    /** After an alarm fires: arm the next occurrence of a recurring one, forget a one-shot. */
    fun afterFired(context: Context, spec: Spec) {
        val next = if (spec.isRecurring) nextOccurrenceAt(spec.timesOfDayMinutes, spec.daysOfWeek) else null
        if (next != null) schedule(context, spec.copy(triggerAtMs = next))
        else prefs(context).edit().remove(PREFIX + spec.key).apply()
    }

    /** AlarmManager forgets everything on reboot (and on some OEMs on app update). */
    fun rearmAll(context: Context) {
        val now = System.currentTimeMillis()
        for (spec in all(context)) {
            val at = when {
                spec.isRecurring -> nextOccurrenceAt(spec.timesOfDayMinutes, spec.daysOfWeek)
                spec.triggerAtMs > now -> spec.triggerAtMs
                else -> null
            }
            if (at != null) schedule(context, spec.copy(triggerAtMs = at)) else cancel(context, spec.key)
        }
    }

    fun nextOccurrenceAt(times: IntArray, days: IntArray, fromMs: Long = System.currentTimeMillis()): Long? {
        if (times.isEmpty()) return null
        val allowedDays = days.toSet()
        val slots = times.sorted()
        for (offset in 0..7) {
            val day = Calendar.getInstance().apply {
                timeInMillis = fromMs
                add(Calendar.DAY_OF_YEAR, offset)
            }
            if (allowedDays.isNotEmpty() && day.get(Calendar.DAY_OF_WEEK) !in allowedDays) continue
            for (slot in slots) {
                val at = (day.clone() as Calendar).apply {
                    set(Calendar.HOUR_OF_DAY, slot / 60)
                    set(Calendar.MINUTE, slot % 60)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis
                if (at > fromMs) return at
            }
        }
        return null
    }

    private fun firePendingIntent(context: Context, key: String): PendingIntent {
        // A unique action per key keeps PendingIntents distinct even if two keys share a hashCode.
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_FIRE + key
            putExtra(AlarmReceiver.EXTRA_KEY, key)
        }
        return PendingIntent.getBroadcast(
            context, key.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    /** What opens when the member taps the alarm clock icon in the status bar. */
    private fun showPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            context, 0x4C554D, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
