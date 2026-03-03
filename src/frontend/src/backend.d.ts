import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PurchaseEntry {
    purchaseDate: string;
    purchaseRate: number;
    productName: string;
    quantity: bigint;
    totalPurchaseValue: number;
}
export interface DailySalesEntry {
    salesman: string;
    stockQty: bigint;
    date: string;
    loadNumber: string;
    stockValue: number;
    daySales: number;
    salesValue: number;
    totalBills: bigint;
}
export interface backendInterface {
    addPurchase(purchase: PurchaseEntry): Promise<void>;
    bulkAddPurchases(purchases: Array<PurchaseEntry>): Promise<void>;
    getAllPurchases(): Promise<Array<PurchaseEntry>>;
    getDailyEntry(date: string, salesman: string): Promise<DailySalesEntry | null>;
    getEntriesByMonth(month: string): Promise<Array<DailySalesEntry>>;
    getEntriesByWeek(week: string): Promise<Array<DailySalesEntry>>;
    getPurchases(date: string): Promise<Array<PurchaseEntry>>;
    saveDailyEntry(entry: DailySalesEntry): Promise<void>;
}
