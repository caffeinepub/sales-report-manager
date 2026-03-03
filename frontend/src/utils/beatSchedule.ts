// Beat schedule for all 6 salesman (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0)
export const SALESMEN = ['SURAJ', 'MUNNA', 'CHANDRADEEP', 'SANTOSH', 'SAGAR', 'SUHAS'] as const;
export type SalesmanName = typeof SALESMEN[number];

type DaySchedule = {
  [day: number]: string; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
};

export const BEAT_SCHEDULE: Record<SalesmanName, DaySchedule> = {
  SURAJ: {
    1: 'BAWADA TOP',
    2: 'RUIKAR COLONY TOP',
    3: 'STAND TOP',
    4: 'BAWADA TOP',
    5: 'RUIKAR COLONY TOP',
    6: 'STAND TOP',
  },
  MUNNA: {
    1: 'SHAHUPURI',
    2: 'SHIVAJI MARKET',
    3: 'WHOLESALE',
    4: 'LAKSHMIPURI',
    5: 'SOMWAR PETH',
    6: 'MANGALWAR PETH D',
  },
  CHANDRADEEP: {
    1: 'SHANIWAR PETH C',
    2: 'STATION ROAD',
    3: 'RUIKAR COLONY',
    4: 'SHIVAJI PETH CC AND SHIVAJI PETH A',
    5: 'SHAHUPURI',
    6: 'NEW SHAHUPURI',
  },
  SANTOSH: {
    1: 'LAKSHYATIRTH',
    2: 'SANE GURUJI VASAHAT',
    3: 'SANE GURUJI 2',
    4: 'SHIVAJI PETH B',
    5: 'MANGALWAR PETH A',
    6: 'MANGALWAR PETH B1',
  },
  SAGAR: {
    1: 'BAVADA',
    2: 'K.BAWADA',
    3: 'NEW PALACE RD',
    4: 'KADAMWADI',
    5: 'MUKTSAINIK VASAHAT',
    6: 'LINE BAZAR',
  },
  SUHAS: {
    1: 'NAGALA PARK TOP',
    2: 'MUKTASAINIK TOP',
    3: 'MANGALWAR PETH TOP',
    4: 'NAGALA PARK TOP',
    5: 'MUKTASAINIK TOP',
    6: 'MANGALWAR PETH TOP',
  },
};

/**
 * Get the beat (area) for a salesman on a given day of week.
 * @param salesman - Salesman name
 * @param dayOfWeek - JS day of week (0=Sun, 1=Mon, ..., 6=Sat)
 * @returns Beat name or 'WEEKLY OFF' for Sunday
 */
export function getBeatForDay(salesman: SalesmanName, dayOfWeek: number): string {
  if (dayOfWeek === 0) return 'WEEKLY OFF';
  return BEAT_SCHEDULE[salesman]?.[dayOfWeek] ?? 'N/A';
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}
