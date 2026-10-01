/**
 * Manages instant quick-tap logs with optimistic updates and undo support.
 * Logs are sent to the server immediately; an "undo" toast appears for 5s.
 */
import { create } from 'zustand';
import { uuidv4 } from '../utils/uuid';
import { api } from '../api/client';

export interface QuickTapEntry {
  id: string;           // local UUID (clientId)
  quickActionId: string;
  occurredAt: string;   // ISO
  count: number;        // number of times today
  lastAt: string;       // last occurrence ISO
  serverId?: string;    // returned from server
  synced: boolean;
}

interface QuickLogState {
  // Map: quickActionId → QuickTapEntry (today only; reset on new day)
  todayTaps: Record<string, QuickTapEntry>;
  // Undo queue
  undoEntry: QuickTapEntry | null;
  undoTimer: ReturnType<typeof setTimeout> | null;

  tap: (quickActionId: string) => Promise<void>;
  undo: () => void;
  resetToday: () => void;
  loadTodayTaps: (quickActionId: string, count: number, lastAt: string) => void;
}

export const useQuickLogStore = create<QuickLogState>((set, get) => ({
  todayTaps: {},
  undoEntry: null,
  undoTimer: null,

  tap: async (quickActionId: string) => {
    const now = new Date().toISOString();
    const clientId = uuidv4();
    const prev = get().todayTaps[quickActionId];

    // Optimistic update
    const entry: QuickTapEntry = {
      id: clientId,
      quickActionId,
      occurredAt: now,
      count: (prev?.count ?? 0) + 1,
      lastAt: now,
      synced: false,
    };
    set(s => ({
      todayTaps: { ...s.todayTaps, [quickActionId]: entry },
      undoEntry: entry,
    }));

    // Set undo timer
    const timer = get().undoTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => set({ undoEntry: null, undoTimer: null }), 5000);
    set({ undoTimer: newTimer });

    // Send to server (non-blocking)
    try {
      const result = await api.post<{ _id: string }>('/logs', {
        clientId,
        source: 'quick_action',
        quickActionId,
        occurredAt: now,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        answers: [],
        mediaIds: [],
      });
      set(s => ({
        todayTaps: {
          ...s.todayTaps,
          [quickActionId]: { ...s.todayTaps[quickActionId], serverId: result._id, synced: true },
        },
      }));
    } catch (err) {
      console.warn('[quickLog] Failed to sync tap, queued for retry:', err);
      // TODO: add to offline sync queue
    }
  },

  undo: () => {
    const entry = get().undoEntry;
    if (!entry) return;

    // Remove from today's taps
    const prev = get().todayTaps[entry.quickActionId];
    if (prev) {
      const newCount = Math.max(0, prev.count - 1);
      set(s => ({
        undoEntry: null,
        todayTaps: {
          ...s.todayTaps,
          [entry.quickActionId]: { ...prev, count: newCount },
        },
      }));
    }

    // Soft-delete on server if we have the serverId
    if (entry.serverId) {
      api.delete(`/logs/${entry.serverId}`).catch(() => {});
    }

    const timer = get().undoTimer;
    if (timer) clearTimeout(timer);
    set({ undoTimer: null });
  },

  resetToday: () => set({ todayTaps: {}, undoEntry: null }),

  loadTodayTaps: (quickActionId, count, lastAt) => {
    set(s => ({
      todayTaps: {
        ...s.todayTaps,
        [quickActionId]: {
          id: uuidv4(),
          quickActionId,
          occurredAt: lastAt,
          count,
          lastAt,
          synced: true,
        },
      },
    }));
  },
}));
