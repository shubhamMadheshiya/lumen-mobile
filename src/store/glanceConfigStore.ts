import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GlanceMetricKey =
  | 'water'
  | 'walking'
  | 'reminders'
  | 'quick_logs'
  | 'day_session'
  | 'active_time';

export interface MetricDefinition {
  key: GlanceMetricKey;
  label: string;
  description: string;
  category: string;
  color: string;
  defaultEnabled: boolean;
}

export const AVAILABLE_METRICS: MetricDefinition[] = [
  {
    key: 'water',
    label: 'Water Intake',
    description: 'Track daily glasses against your hydration target',
    category: 'Hydration',
    color: '#0284C7',
    defaultEnabled: true,
  },
  {
    key: 'walking',
    label: 'Walking Distance',
    description: 'Daily walking distance in km and quick GPS launch',
    category: 'Activity',
    color: '#FF6B35',
    defaultEnabled: true,
  },
  {
    key: 'reminders',
    label: 'Active Reminders',
    description: 'Count of upcoming alerts and quick access to alarms',
    category: 'Alerts',
    color: '#8B5CF6',
    defaultEnabled: true,
  },
  {
    key: 'quick_logs',
    label: 'Quick Logs',
    description: 'Count of symptoms and check-ins recorded today',
    category: 'Logging',
    color: '#F43F5E',
    defaultEnabled: true,
  },
  {
    key: 'day_session',
    label: 'Day Session',
    description: 'Wake time and bedtime clock-in status',
    category: 'Sleep',
    color: '#10B981',
    defaultEnabled: true,
  },
  {
    key: 'active_time',
    label: 'Active Time',
    description: 'Total active and walking minutes accumulated today',
    category: 'Activity',
    color: '#F59E0B',
    defaultEnabled: true,
  },
];

const STORAGE_KEY = 'lumen:glance_metrics_v1';

const DEFAULT_STATE: Record<GlanceMetricKey, boolean> = {
  water: true,
  walking: true,
  reminders: true,
  quick_logs: true,
  day_session: true,
  active_time: true,
};

interface GlanceConfigState {
  enabledMetrics: Record<GlanceMetricKey, boolean>;
  isLoaded: boolean;

  fetchGlanceConfig: () => Promise<void>;
  toggleMetric: (key: GlanceMetricKey) => Promise<boolean>;
  setMetricEnabled: (key: GlanceMetricKey, enabled: boolean) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isMetricEnabled: (key: GlanceMetricKey) => boolean;
  getActiveCount: () => number;
}

export const useGlanceConfigStore = create<GlanceConfigState>((set, get) => ({
  enabledMetrics: { ...DEFAULT_STATE },
  isLoaded: false,

  fetchGlanceConfig: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          set({
            enabledMetrics: {
              ...DEFAULT_STATE,
              ...parsed,
            },
            isLoaded: true,
          });
          return;
        }
      }
    } catch {}

    set({ enabledMetrics: { ...DEFAULT_STATE }, isLoaded: true });
  },

  toggleMetric: async (key: GlanceMetricKey) => {
    const current = get().enabledMetrics;
    const nextVal = !current[key];
    const updated = { ...current, [key]: nextVal };

    set({ enabledMetrics: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    return nextVal;
  },

  setMetricEnabled: async (key: GlanceMetricKey, enabled: boolean) => {
    const current = get().enabledMetrics;
    const updated = { ...current, [key]: enabled };

    set({ enabledMetrics: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  resetToDefaults: async () => {
    set({ enabledMetrics: { ...DEFAULT_STATE }, isLoaded: true });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE)).catch(() => {});
  },

  isMetricEnabled: (key: GlanceMetricKey) => {
    return get().enabledMetrics[key] ?? true;
  },

  getActiveCount: () => {
    const state = get().enabledMetrics;
    return Object.values(state).filter(Boolean).length;
  },
}));
