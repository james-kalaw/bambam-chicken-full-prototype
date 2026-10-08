// CASH DRAWER actions (future FastAPI module: "payments" / "cash").

import type { DemoState } from "@/lib/demo-state";
import { drawerTotals } from "@/lib/cash-utils";
import { peso } from "@/lib/format";
import { makeId } from "@/lib/order-utils";
import type { CashEntry } from "@/types/cash";
import { actor, nowIso, withAudit } from "./helpers";

/** Adds one movement (sale, refund or expense) to the open drawer */
export function addCashEntry(s: DemoState, entry: Omit<CashEntry, "id" | "by" | "createdAt">): DemoState {
  const full: CashEntry = { ...entry, id: makeId("cash"), by: actor(s).user, createdAt: nowIso() };
  return { ...s, cashDrawer: { ...s.cashDrawer, entries: [full, ...s.cashDrawer.entries] } };
}

export function recordCashExpense(s: DemoState, amount: number, note: string): DemoState {
  const next = addCashEntry(s, { type: "expense", amount, note });
  return withAudit(next, "Recorded cash expense", "Cash Drawer", `${peso(amount)} — ${note}`);
}

/** Start a new day/shift: new opening cash, empty movement list */
export function openCashDrawer(s: DemoState, openingCash: number): DemoState {
  const next: DemoState = {
    ...s,
    cashDrawer: { status: "open", openingCash, openedAt: nowIso(), openedBy: actor(s).user, entries: [] },
  };
  return withAudit(next, "Opened cash drawer", "Cash Drawer", `Opening cash ${peso(openingCash)}`);
}

/** End of shift: save the counted cash so the difference can be reviewed */
export function closeCashDrawer(s: DemoState, countedCash: number): DemoState {
  const drawer = { ...s.cashDrawer, status: "closed" as const, countedCash, closedAt: nowIso(), closedBy: actor(s).user };
  const { expectedCash, difference } = drawerTotals(drawer);
  return withAudit(
    { ...s, cashDrawer: drawer },
    "Closed cash drawer",
    "Cash Drawer",
    `Expected ${peso(expectedCash)}, counted ${peso(countedCash)}, difference ${peso(difference ?? 0)}`,
  );
}
