import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { DailySalesEntry, PurchaseEntry } from '../backend';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import { SALESMEN } from '../utils/beatSchedule';

// ─── Daily Entries ────────────────────────────────────────────────────────────

export function useGetDailyEntries(date: Date) {
  const { actor, isFetching } = useActor();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery<DailySalesEntry[]>({
    queryKey: ['daily', dateStr],
    queryFn: async () => {
      if (!actor) return [];
      const results = await Promise.all(
        SALESMEN.map((salesman) => actor.getDailyEntry(dateStr, salesman))
      );
      return results.filter((e): e is DailySalesEntry => e !== null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveDailyEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: DailySalesEntry) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveDailyEntry(entry);
      // Also persist to localStorage
      const key = `daily_${entry.date}_${entry.salesman}`;
      localStorage.setItem(key, JSON.stringify({
        ...entry,
        totalBills: Number(entry.totalBills),
        stockQty: Number(entry.stockQty),
      }));
    },
    onSuccess: (_, entry) => {
      queryClient.invalidateQueries({ queryKey: ['daily', entry.date] });
      queryClient.invalidateQueries({ queryKey: ['weekly'] });
      queryClient.invalidateQueries({ queryKey: ['monthly'] });
    },
  });
}

export function useSaveDailyEntries() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: DailySalesEntry[]) => {
      if (!actor) throw new Error('Actor not initialized');
      await Promise.all(entries.map((entry) => {
        const key = `daily_${entry.date}_${entry.salesman}`;
        localStorage.setItem(key, JSON.stringify({
          ...entry,
          totalBills: Number(entry.totalBills),
          stockQty: Number(entry.stockQty),
        }));
        return actor.saveDailyEntry(entry);
      }));
    },
    onSuccess: (_, entries) => {
      if (entries.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['daily', entries[0].date] });
        queryClient.invalidateQueries({ queryKey: ['weekly'] });
        queryClient.invalidateQueries({ queryKey: ['monthly'] });
      }
    },
  });
}

// ─── Weekly Entries ───────────────────────────────────────────────────────────

export function useGetWeeklyEntries(weekDate: Date) {
  const { actor, isFetching } = useActor();
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');

  return useQuery<DailySalesEntry[]>({
    queryKey: ['weekly', weekKey],
    queryFn: async () => {
      if (!actor) return [];
      // Get all days in the week (Mon-Sat)
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
        .filter((d) => getDay(d) !== 0); // exclude Sunday

      const allEntries: DailySalesEntry[] = [];
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const results = await Promise.all(
          SALESMEN.map((salesman) => actor.getDailyEntry(dateStr, salesman))
        );
        results.forEach((e) => {
          if (e !== null) allEntries.push(e);
        });
      }
      return allEntries;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Monthly Entries ──────────────────────────────────────────────────────────

export function useGetMonthlyEntries(month: number, year: number) {
  const { actor, isFetching } = useActor();
  const monthStr = format(new Date(year, month - 1, 1), 'yyyy-MM');

  return useQuery<DailySalesEntry[]>({
    queryKey: ['monthly', monthStr],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByMonth(monthStr);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export function useGetAllPurchases() {
  const { actor, isFetching } = useActor();

  return useQuery<PurchaseEntry[]>({
    queryKey: ['purchases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (purchase: PurchaseEntry) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addPurchase(purchase);
      // Also persist to localStorage
      const existing = JSON.parse(localStorage.getItem('purchases') || '[]');
      existing.push({
        ...purchase,
        quantity: Number(purchase.quantity),
      });
      localStorage.setItem('purchases', JSON.stringify(existing));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

// ─── Local Storage Helpers ────────────────────────────────────────────────────

export function getLocalDailyEntry(date: string, salesman: string): DailySalesEntry | null {
  const key = `daily_${date}_${salesman}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      totalBills: BigInt(parsed.totalBills || 0),
      stockQty: BigInt(parsed.stockQty || 0),
    };
  } catch {
    return null;
  }
}

export function getLocalPurchases(): PurchaseEntry[] {
  const stored = localStorage.getItem('purchases');
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((p: Record<string, unknown>) => ({
      ...p,
      quantity: BigInt(Number(p.quantity) || 0),
    }));
  } catch {
    return [];
  }
}
