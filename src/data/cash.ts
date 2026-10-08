import { isToday } from "@/lib/order-utils";
import type { CashDrawer, CashEntry } from "@/types/cash";
import type { Order } from "@/types/order";

// DEMO CASH DRAWER — fictional amounts. Opened this morning by the cashier.

export function createCashDrawer(orders: Order[]): CashDrawer {
  // Opened at 8:00 AM — or 3 hours ago if the demo runs before 8 AM
  const opened = new Date();
  opened.setHours(8, 0, 0, 0);
  if (opened.getTime() > Date.now()) opened.setTime(Date.now() - 3 * 60 * 60_000);
  const at = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return (d.getTime() < Date.now() ? d : new Date(Date.now() - 60 * 60_000)).toISOString();
  };

  const entries: CashEntry[] = [
    { id: "cash-1", type: "sale", amount: 14_350, note: "Cash sales earlier today (demo total)", by: "Jun Ramos", createdAt: at(11, 0) },
    { id: "cash-2", type: "refund", amount: 500, note: "Refund for T-031 (demo)", by: "Jun Ramos", createdAt: at(11, 20) },
    { id: "cash-3", type: "expense", amount: 300, note: "Small purchase paid from drawer (demo)", by: "Carla Mendoza", createdAt: at(11, 40) },
  ];

  // Cash payments of the seeded orders also went into the drawer
  for (const o of orders) {
    if (o.payment.method === "cash" && o.payment.status === "paid" && isToday(o.createdAt)) {
      entries.push({
        id: `cash-${o.id}`,
        type: "sale",
        amount: o.total, // the ORDER TOTAL, not the cash handed over
        orderId: o.id,
        queueNumber: o.queueNumber,
        by: "Jun Ramos",
        createdAt: o.payment.paidAt ?? o.createdAt,
      });
    }
  }

  return {
    status: "open",
    openingCash: 2_000,
    openedAt: opened.toISOString(),
    openedBy: "Jun Ramos",
    entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
