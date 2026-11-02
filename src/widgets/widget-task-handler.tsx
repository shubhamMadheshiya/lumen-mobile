import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TodayGlanceWidget } from './TodayGlanceWidget';
import { NextReminderWidget } from './NextReminderWidget';
import { WaterGoalWidget } from './WaterGoalWidget';
import { QuickTapWidget } from './QuickTapWidget';
import { MyDayWidget } from './MyDayWidget';
import {
  getWidgetSnapshot,
  saveWidgetSnapshot,
  syncLiveWidgetsFromStores,
  isWaterAction,
  isStandAction,
  isMedsAction,
  isFlareAction,
} from './widgetSync';

async function syncQuickTapToStore(type: 'WATER' | 'STAND' | 'MEDS' | 'FLARE'): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { rehydrateConfig } = require('../store/configStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { rehydrateTodayTaps, useQuickLogStore } = require('../store/quickLogStore');

    const config = await rehydrateConfig();
    await rehydrateTodayTaps();

    const quickActions = config?.quickActions || [];
    let matcher: (a: any) => boolean;
    let fallbackKey: string;

    switch (type) {
      case 'WATER':
        matcher = isWaterAction;
        fallbackKey = 'qa_water';
        break;
      case 'STAND':
        matcher = isStandAction;
        fallbackKey = 'qa_stood_up';
        break;
      case 'MEDS':
        matcher = isMedsAction;
        fallbackKey = 'qa_medication';
        break;
      case 'FLARE':
        matcher = isFlareAction;
        fallbackKey = 'qa_flare';
        break;
    }

    const matchedAction = quickActions.find(matcher);
    const actionId = matchedAction?._id || fallbackKey;

    const tap = useQuickLogStore?.getState?.()?.tap;
    if (tap) {
      await tap(actionId);
    }
  } catch (err) {
    console.warn(`[widgetTaskHandler] Error syncing ${type} tap to store:`, err);
  }
}

async function syncToggleTaskToStore(taskId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { rehydrateTasks, useTaskStore } = require('../store/taskStore');
    await rehydrateTasks();
    const toggleTask = useTaskStore?.getState?.()?.toggleTaskCompleted;
    if (toggleTask) {
      await toggleTask(taskId);
    }
  } catch (err) {
    console.warn(`[widgetTaskHandler] Error syncing task toggle ${taskId}:`, err);
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction, clickActionData } = props;
  const snapshot = await getWidgetSnapshot();

  if (widgetAction === 'WIDGET_CLICK') {
    if (clickAction === 'LOG_WATER') {
      const nextCount = (snapshot.waterCount || 0) + 1;
      snapshot.waterCount = nextCount;
      snapshot.completedTasks = (snapshot.completedTasks || 0) + 1;
      if (snapshot.tasksLeft > 0) snapshot.tasksLeft -= 1;
      await saveWidgetSnapshot(snapshot);
      await syncQuickTapToStore('WATER');
      await syncLiveWidgetsFromStores();
    } else if (clickAction === 'LOG_STAND') {
      const nextCount = (snapshot.stoodUpCount || 0) + 1;
      snapshot.stoodUpCount = nextCount;
      snapshot.completedTasks = (snapshot.completedTasks || 0) + 1;
      if (snapshot.tasksLeft > 0) snapshot.tasksLeft -= 1;
      await saveWidgetSnapshot(snapshot);
      await syncQuickTapToStore('STAND');
      await syncLiveWidgetsFromStores();
    } else if (clickAction === 'LOG_MEDS') {
      const nextCount = (snapshot.medsCount || 0) + 1;
      snapshot.medsCount = nextCount;
      snapshot.completedTasks = (snapshot.completedTasks || 0) + 1;
      if (snapshot.tasksLeft > 0) snapshot.tasksLeft -= 1;
      await saveWidgetSnapshot(snapshot);
      await syncQuickTapToStore('MEDS');
      await syncLiveWidgetsFromStores();
    } else if (clickAction === 'LOG_FLARE') {
      const nextCount = (snapshot.flareCount || 0) + 1;
      snapshot.flareCount = nextCount;
      await saveWidgetSnapshot(snapshot);
      await syncQuickTapToStore('FLARE');
      await syncLiveWidgetsFromStores();
    } else if (clickAction === 'TOGGLE_TASK' && clickActionData?.taskId) {
      const taskId = String(clickActionData.taskId);
      if (snapshot.myDayTasks) {
        const task = snapshot.myDayTasks.find((t) => t.id === taskId);
        if (task) {
          task.isCompleted = !task.isCompleted;
          const completed = snapshot.myDayTasks.filter((t) => t.isCompleted).length;
          const total = snapshot.myDayTasks.length;
          snapshot.completedTasks = completed;
          snapshot.tasksLeft = Math.max(0, total - completed);
          await saveWidgetSnapshot(snapshot);
        }
      }

      await syncToggleTaskToStore(taskId);
      await syncLiveWidgetsFromStores();
    }
  }

  switch (widgetInfo.widgetName) {
    case 'TodayGlanceWidget':
      props.renderWidget(<TodayGlanceWidget data={snapshot} />);
      break;
    case 'NextReminderWidget':
      props.renderWidget(<NextReminderWidget data={snapshot} />);
      break;
    case 'WaterGoalWidget':
      props.renderWidget(<WaterGoalWidget data={snapshot} />);
      break;
    case 'QuickTapWidget':
      props.renderWidget(<QuickTapWidget data={snapshot} />);
      break;
    case 'MyDayWidget':
      props.renderWidget(<MyDayWidget data={snapshot} />);
      break;
    default:
      break;
  }
}
