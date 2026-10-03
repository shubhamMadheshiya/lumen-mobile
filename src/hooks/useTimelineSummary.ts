/**
 * Fetches log entries for a month and computes per-day severity summary
 * for the CalendarHeatMap.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ILogEntry } from '@lumen/shared';
import { DaySeverity } from '../components/timeline/CalendarHeatMap';

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export function useTimelineSummary(year: number, month: number) {
  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  return useQuery<DaySeverity[]>({
    queryKey: ['timeline-summary', year, month],
    queryFn: async () => {
      const res = await api.get<any>('/logs', { params: { from, to, limit: 1000 } });
      const entries: ILogEntry[] = Array.isArray(res) ? res : (res?.logs ?? res?.data ?? []);

      const map: Record<string, { maxSeverity: number; hasLogs: boolean }> = {};
      for (const e of entries) {
        const day = toISO(new Date(e.occurredAt));
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
    staleTime: 15 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useDayEntries(date: string) {
  const d = new Date(date + 'T00:00:00');
  const from = d.toISOString();
  const toDate = new Date(date + 'T23:59:59');
  const to = toDate.toISOString();

  return useQuery<ILogEntry[]>({
    queryKey: ['day-entries', date],
    queryFn: async () => {
      const res = await api.get<any>('/logs', { params: { from, to, limit: 500 } });
      return Array.isArray(res) ? res : (res?.logs ?? res?.data ?? []);
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
