/**
 * Fetches log entries for a month and computes per-day severity summary
 * for the CalendarHeatMap.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ILogEntry } from '@lumen/shared';
import { DaySeverity } from '../components/timeline/CalendarHeatMap';

export function toLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  if (!dateStr || !dateStr.includes('-')) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
  const endOfDay = new Date(y, m, d, 23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export function useTimelineSummary(year: number, month: number) {
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const from = startOfMonth.toISOString();
  const to = endOfMonth.toISOString();

  return useQuery<DaySeverity[]>({
    queryKey: ['timeline-summary', year, month],
    queryFn: async () => {
      const res = await api.get<any>('/logs', { params: { from, to, limit: 1000 } });
      const entries: ILogEntry[] = Array.isArray(res) ? res : (res?.logs ?? res?.data ?? []);

      const map: Record<string, { maxSeverity: number; hasLogs: boolean }> = {};
      for (const e of entries) {
        const day = toLocalDateString(new Date(e.occurredAt));
        if (!map[day]) map[day] = { maxSeverity: -1, hasLogs: true };
        map[day].hasLogs = true;
        for (const ans of (e.answers || [])) {
          for (const v of ans.values ?? []) {
            if (v.dataType === 'range' && v.fieldKey === 'severity') {
              const s = Number(v.value);
              if (s > map[day].maxSeverity) map[day].maxSeverity = s;
            }
          }
        }
        if (map[day].maxSeverity === -1) map[day].maxSeverity = 0;
      }

      return Object.entries(map).map(([date, info]) => ({ date, ...info }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}

export function useDayEntries(date: string) {
  const { startOfDay, endOfDay } = parseLocalDate(date);
  const from = startOfDay.toISOString();
  const to = endOfDay.toISOString();

  return useQuery<ILogEntry[]>({
    queryKey: ['day-entries', date],
    queryFn: async () => {
      if (!date) return [];
      const res = await api.get<any>('/logs', { params: { from, to, limit: 500 } });
      return Array.isArray(res) ? res : (res?.logs ?? res?.data ?? []);
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}

