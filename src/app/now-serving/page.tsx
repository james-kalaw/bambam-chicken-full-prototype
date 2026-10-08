"use client";

import { ChefHat, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { DEMO_CONFIG } from "@/data/demo-config";
import { isToday } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";

// NOW SERVING — customer-facing screen for a TV/tablet near the counter.
// Shows ONLY queue numbers (no names, no items, no prices).
// Uses the same simple statuses as the kitchen — there is no "Ready" step:
//   Confirmed / Preparing  →  "Preparing"
//   Completed              →  "Completed — please claim" (for a few minutes)

function useClock(ms = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export default function NowServingPage() {
  const { orders } = useDemoStore();
  const now = useClock();
  const claimWindowMs = DEMO_CONFIG.nowServingClaimMinutes * 60_000;

  const preparing = orders
    .filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing")
    .sort((a, b) => (a.confirmedAt ?? a.createdAt).localeCompare(b.confirmedAt ?? b.createdAt));
  const completed = orders
    .filter((o) => o.orderStatus === "completed" && o.completedAt && isToday(o.completedAt) && now - new Date(o.completedAt).getTime() < claimWindowMs)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

  return (
    <div className="flex min-h-dvh flex-col bg-bambam-brown p-4 text-white sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <span className="rounded-2xl bg-bambam-cream px-3 py-1.5"><BrandLogo /></span>
        <h1 className="font-display text-3xl font-bold tracking-wide sm:text-5xl">NOW SERVING</h1>
      </header>

      <div className="grid flex-1 gap-4 md:grid-cols-2 md:gap-8">
        <section aria-labelledby="preparing-title" className="rounded-3xl bg-white/10 p-5 sm:p-8">
          <h2 id="preparing-title" className="mb-5 flex items-center gap-3 text-2xl font-black tracking-wide text-bambam-yellow sm:text-4xl">
            <ChefHat className="size-8 sm:size-10" aria-hidden /> PREPARING
          </h2>
          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3" aria-live="polite">
            {preparing.map((o) => (
              <li key={o.id} className="rounded-2xl bg-white/15 px-2 py-4 text-center text-3xl font-black tracking-tight whitespace-nowrap tabular-nums sm:text-4xl xl:text-5xl">
                {o.queueNumber}
              </li>
            ))}
          </ul>
          {preparing.length === 0 && <p className="text-xl text-white/70">No orders in the kitchen.</p>}
        </section>

        <section aria-labelledby="completed-title" className="rounded-3xl bg-success p-5 sm:p-8">
          <h2 id="completed-title" className="mb-5 flex items-center gap-3 text-2xl font-black tracking-wide sm:text-4xl">
            <PackageCheck className="size-8 sm:size-10" aria-hidden /> COMPLETED — PLEASE CLAIM
          </h2>
          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3" aria-live="polite">
            {completed.map((o) => (
              <li key={o.id} className="rounded-2xl bg-white px-2 py-4 text-center text-3xl font-black tracking-tight whitespace-nowrap text-success tabular-nums sm:text-4xl xl:text-5xl">
                {o.queueNumber}
              </li>
            ))}
          </ul>
          {completed.length === 0 && <p className="text-xl text-white/85">Completed orders will appear here.</p>}
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-white/70">
        Listen for your number or watch this screen. Completed numbers stay up for {DEMO_CONFIG.nowServingClaimMinutes} minutes.
      </p>
    </div>
  );
}
