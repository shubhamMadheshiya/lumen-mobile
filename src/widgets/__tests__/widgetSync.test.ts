import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isWaterAction,
  isStandAction,
  isMedsAction,
  isFlareAction,
  getWidgetSnapshot,
  saveWidgetSnapshot,
} from '../widgetSync';
import { widgetTaskHandler } from '../widget-task-handler';
import { useQuickLogStore, rehydrateTodayTaps } from '../../store/quickLogStore';
import { useTaskStore, rehydrateTasks } from '../../store/taskStore';
import { useConfigStore } from '../../store/configStore';

jest.mock('../../api/client', () => ({
  api: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue({ _id: 'mock_server_id' }),
    patch: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('react-native-android-widget', () => ({
  requestWidgetUpdate: jest.fn().mockResolvedValue(true),
}));

describe('Widget Action Matching & Synchronization', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useQuickLogStore.setState({ todayTaps: {}, undoEntry: null });
    useTaskStore.setState({ tasks: [] });
  });

  describe('Quick Action Matchers', () => {
    it('correctly identifies Water quick action', () => {
      expect(isWaterAction({ templateKey: 'qa_water', label: 'Drink Water' })).toBe(true);
      expect(isWaterAction({ icon: '💧', label: 'Hydration' })).toBe(true);
      expect(isWaterAction({ label: 'Drink' })).toBe(true);
      expect(isWaterAction({ templateKey: 'qa_meds', label: 'Pill' })).toBe(false);
    });

    it('correctly identifies Stand Up quick action', () => {
      expect(isStandAction({ templateKey: 'qa_stood_up', label: 'Stood Up' })).toBe(true);
      expect(isStandAction({ icon: '🧍', label: 'Standing' })).toBe(true);
      expect(isStandAction({ templateKey: 'qa_water', label: 'Water' })).toBe(false);
    });

    it('correctly identifies Meds quick action', () => {
      expect(isMedsAction({ templateKey: 'qa_medication', label: 'Meds' })).toBe(true);
      expect(isMedsAction({ icon: '💊', label: 'Daily Pill' })).toBe(true);
      expect(isMedsAction({ label: 'Prescription' })).toBe(true);
      expect(isMedsAction({ label: 'Water' })).toBe(false);
    });

    it('correctly identifies Flare quick action', () => {
      expect(isFlareAction({ templateKey: 'qa_flare', label: 'Flare Log' })).toBe(true);
      expect(isFlareAction({ icon: '🔥', label: 'Symptom Spike' })).toBe(true);
      expect(isFlareAction({ label: 'Walk' })).toBe(false);
    });
  });

  describe('Store Rehydration', () => {
    it('rehydrates todayTaps from AsyncStorage', async () => {
      const storedTaps = {
        qa_water: {
          id: 'test_1',
          quickActionId: 'qa_water',
          occurredAt: new Date().toISOString(),
          count: 3,
          lastAt: new Date().toISOString(),
          synced: true,
        },
      };
      await AsyncStorage.setItem('lumen:quick_log:today_taps_v1', JSON.stringify(storedTaps));

      const loaded = await rehydrateTodayTaps();
      expect(loaded.qa_water).toBeDefined();
      expect(loaded.qa_water.count).toBe(3);
      expect(useQuickLogStore.getState().todayTaps.qa_water?.count).toBe(3);
    });

    it('rehydrates tasks from AsyncStorage', async () => {
      const storedTasks = [
        {
          _id: 'task_123',
          title: 'Drink water and walk',
          isCompleted: false,
          inMyDay: true,
        },
      ];
      await AsyncStorage.setItem('lumen:tasks:cache_v1', JSON.stringify(storedTasks));

      const loaded = await rehydrateTasks();
      expect(loaded.length).toBe(1);
      expect(loaded[0]._id).toBe('task_123');
      expect(useTaskStore.getState().tasks.length).toBe(1);
    });
  });

  describe('Widget Click Handler Integration', () => {
    it('updates snapshot and dispatches tap to quickLogStore on LOG_WATER', async () => {
      useConfigStore.setState({
        config: {
          quickActions: [
            { _id: 'qa_water_id', templateKey: 'qa_water', label: 'Water', icon: '💧' } as any,
          ],
        } as any,
      });

      const renderWidgetMock = jest.fn();
      await widgetTaskHandler({
        widgetInfo: { widgetName: 'TodayGlanceWidget', widgetId: 1, width: 300, height: 200 },
        widgetAction: 'WIDGET_CLICK',
        clickAction: 'LOG_WATER',
        renderWidget: renderWidgetMock,
      });

      // Snapshot should be updated
      const snapshot = await getWidgetSnapshot();
      expect(snapshot.waterCount).toBeGreaterThanOrEqual(1);

      // quickLogStore should have received the tap
      const taps = useQuickLogStore.getState().todayTaps;
      expect(taps.qa_water_id).toBeDefined();
      expect(taps.qa_water_id.count).toBe(1);
    });

    it('toggles task in store and snapshot on TOGGLE_TASK', async () => {
      const initialTasks = [
        {
          _id: 'task_456',
          title: 'Take vitamins',
          isCompleted: false,
          inMyDay: true,
        },
      ];
      await AsyncStorage.setItem('lumen:tasks:cache_v1', JSON.stringify(initialTasks));
      await saveWidgetSnapshot({
        myDayTasks: [
          { id: 'task_456', title: 'Take vitamins', isCompleted: false },
        ],
      });

      const renderWidgetMock = jest.fn();
      await widgetTaskHandler({
        widgetInfo: { widgetName: 'MyDayWidget', widgetId: 2, width: 300, height: 200 },
        widgetAction: 'WIDGET_CLICK',
        clickAction: 'TOGGLE_TASK',
        clickActionData: { taskId: 'task_456' },
        renderWidget: renderWidgetMock,
      });

      // Task store should be toggled
      const currentTask = useTaskStore.getState().tasks.find((t) => t._id === 'task_456');
      expect(currentTask?.isCompleted).toBe(true);

      // Snapshot should be toggled
      const snapshot = await getWidgetSnapshot();
      const snapTask = snapshot.myDayTasks?.find((t) => t.id === 'task_456');
      expect(snapTask?.isCompleted).toBe(true);
    });
  });
});

