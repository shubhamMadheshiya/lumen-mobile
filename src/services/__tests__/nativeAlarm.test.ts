/**
 * Android builds that include the native alarm (plugins/withLumenAlarm): the native side rings
 * time-based reminders, so expo-notifications must not ring them a second time.
 */
import { NativeModules, Platform } from 'react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../api/client', () => ({
  api: { get: jest.fn().mockResolvedValue([]), post: jest.fn().mockResolvedValue({}) },
}));

const mockSchedule = jest.fn().mockResolvedValue('expo_id');
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { MAX: 5, HIGH: 4, LOW: 2 },
  AndroidNotificationVisibility: { PUBLIC: 1, PRIVATE: 0 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
}));

const native = {
  scheduleAlarm: jest.fn().mockResolvedValue(true),
  cancelAlarm: jest.fn().mockResolvedValue(true),
  getCapabilities: jest.fn().mockResolvedValue({ exactAlarmsAllowed: true, fullScreenIntentAllowed: true }),
};
Platform.OS = 'android';
(NativeModules as Record<string, unknown>).AlarmScheduler = native;

// Required after the native mock is in place: alarmScheduler reads NativeModules at load time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const notifications = require('../notifications');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alarmScheduler = require('../alarmScheduler');

const daily = (over: Record<string, unknown> = {}) => ({
  _id: 'rem_1', name: 'Water', category: 'HYDRATION', scheduleType: 'DAILY', targetTime: '08:30',
  enabled: true, sound: 'zen_gong', ...over,
});

describe('native Android alarm path', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports the native alarm as available', () => {
    expect(alarmScheduler.isNativeAlarmAvailable()).toBe(true);
  });

  it('rings a daily reminder natively only, with the chosen tone, and does not schedule an expo copy', async () => {
    await notifications.scheduleReminder(daily());
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(native.scheduleAlarm).toHaveBeenCalledWith(
      'rem_1', expect.any(String), expect.any(String), expect.any(Number), [8 * 60 + 30], [], 'zen_gong',
    );
  });

  it("uses the phone's own alarm tone when no tone was chosen", async () => {
    await notifications.scheduleReminder(daily({ sound: undefined }));
    expect(native.scheduleAlarm.mock.calls[0][6]).toBe('default');
  });

  it('still uses expo-notifications for inactivity reminders, which have no native alarm', async () => {
    await notifications.scheduleReminder(daily({ scheduleType: 'INACTIVITY', type: 'inactivity' }));
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(native.scheduleAlarm).not.toHaveBeenCalled();
  });

  it("snoozes under its own key so the reminder's next regular alarm is not replaced", async () => {
    await notifications.snoozeReminder('rem_1', 10, 'Water');
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(native.scheduleAlarm).toHaveBeenCalledTimes(1);
    expect(native.scheduleAlarm.mock.calls[0][0]).toBe('rem_1::snooze');
  });

  it('test alarm rings natively after a delay long enough to lock the phone', async () => {
    const before = Date.now();
    await expect(notifications.sendTestReminderNotification()).resolves.toBe(true);
    expect(mockSchedule).not.toHaveBeenCalled();
    const at = native.scheduleAlarm.mock.calls[0][3] as number;
    expect(at - before).toBeGreaterThanOrEqual(notifications.TEST_ALARM_DELAY_MS);
  });

  it('defaults overlayAllowed to false when the native side does not report it', async () => {
    await expect(alarmScheduler.getAlarmCapabilities()).resolves.toEqual({
      exactAlarmsAllowed: true, fullScreenIntentAllowed: true, overlayAllowed: false,
    });
  });
});
