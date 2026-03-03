import { format, getDay, subDays } from "date-fns";
import type { DailySalesEntry, PurchaseEntry } from "../backend";
import { SALESMEN, getBeatForDay } from "./beatSchedule";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

export function generateSampleDailyEntries(): DailySalesEntry[] {
  const entries: DailySalesEntry[] = [];
  const today = new Date();

  // Generate for past 14 days (excluding Sundays)
  for (let daysBack = 1; daysBack <= 14; daysBack++) {
    const date = subDays(today, daysBack);
    const dayOfWeek = getDay(date);
    if (dayOfWeek === 0) continue; // Skip Sundays

    const dateStr = format(date, "yyyy-MM-dd");

    for (const salesman of SALESMEN) {
      const _beat = getBeatForDay(salesman, dayOfWeek);
      const loadNum = randomBetween(1, 5);
      const totalBills = randomBetween(15, 45);
      const salesValue = randomFloat(8000, 35000);
      const daySales = randomFloat(5000, 25000);
      const stockValue = randomFloat(2000, 15000);
      const stockQty = randomBetween(50, 300);

      entries.push({
        date: dateStr,
        salesman,
        loadNumber: `L${loadNum.toString().padStart(3, "0")}`,
        totalBills: BigInt(totalBills),
        salesValue,
        daySales,
        stockValue,
        stockQty: BigInt(stockQty),
      });
    }
  }

  return entries;
}

export function generateSamplePurchases(): PurchaseEntry[] {
  const today = new Date();
  return [
    {
      productName: "Biscuits Assorted Pack",
      purchaseDate: format(subDays(today, 10), "yyyy-MM-dd"),
      quantity: BigInt(500),
      purchaseRate: 12.5,
      totalPurchaseValue: 6250,
    },
    {
      productName: "Namkeen Mix 200g",
      purchaseDate: format(subDays(today, 8), "yyyy-MM-dd"),
      quantity: BigInt(300),
      purchaseRate: 18.0,
      totalPurchaseValue: 5400,
    },
    {
      productName: "Chips Variety Pack",
      purchaseDate: format(subDays(today, 5), "yyyy-MM-dd"),
      quantity: BigInt(400),
      purchaseRate: 22.5,
      totalPurchaseValue: 9000,
    },
    {
      productName: "Candy Assorted",
      purchaseDate: format(subDays(today, 3), "yyyy-MM-dd"),
      quantity: BigInt(1000),
      purchaseRate: 2.0,
      totalPurchaseValue: 2000,
    },
    {
      productName: "Wafers Premium",
      purchaseDate: format(subDays(today, 1), "yyyy-MM-dd"),
      quantity: BigInt(250),
      purchaseRate: 35.0,
      totalPurchaseValue: 8750,
    },
  ];
}
