import { format, getDay } from "date-fns";
import React, { useState, useEffect } from "react";
import Layout, { type NavSection } from "./components/Layout";
import { useActor } from "./hooks/useActor";
import DashboardPage from "./pages/DashboardPage";
import ExportReportsPage from "./pages/ExportReportsPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import PurchaseStockPage from "./pages/PurchaseStockPage";
import WeeklyReportPage from "./pages/WeeklyReportPage";
import {
  generateSampleDailyEntries,
  generateSamplePurchases,
} from "./utils/sampleData";

const SEED_KEY = "srm_seeded_v1";

function SeedData() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;
    if (localStorage.getItem(SEED_KEY)) return;

    const seed = async () => {
      try {
        // Seed daily entries
        const dailyEntries = generateSampleDailyEntries();
        for (const entry of dailyEntries) {
          const lsKey = `daily_${entry.date}_${entry.salesman}`;
          if (!localStorage.getItem(lsKey)) {
            localStorage.setItem(
              lsKey,
              JSON.stringify({
                ...entry,
                totalBills: Number(entry.totalBills),
                stockQty: Number(entry.stockQty),
              }),
            );
            try {
              await actor.saveDailyEntry(entry);
            } catch {
              // Backend may not be ready; localStorage fallback is sufficient
            }
          }
        }

        // Seed purchases
        const purchases = generateSamplePurchases();
        const existingPurchases = JSON.parse(
          localStorage.getItem("purchases") || "[]",
        );
        if (existingPurchases.length === 0) {
          const serialized = purchases.map((p) => ({
            ...p,
            quantity: Number(p.quantity),
          }));
          localStorage.setItem("purchases", JSON.stringify(serialized));
          for (const purchase of purchases) {
            try {
              await actor.addPurchase(purchase);
            } catch {
              // Backend may not be ready; localStorage fallback is sufficient
            }
          }
        }

        localStorage.setItem(SEED_KEY, "1");
      } catch (err) {
        console.error("Seeding error:", err);
      }
    };

    seed();
  }, [actor, isFetching]);

  return null;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");

  const renderPage = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardPage />;
      case "weekly":
        return <WeeklyReportPage />;
      case "monthly":
        return <MonthlyReportPage />;
      case "stock":
        return <PurchaseStockPage />;
      case "export":
        return <ExportReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <SeedData />
      <Layout activeSection={activeSection} onNavigate={setActiveSection}>
        {renderPage()}
      </Layout>
    </>
  );
}
