import type { CashDrawer, CashEntry } from "@/types/cash";

/**
 * Cash drawer math. Expected cash = opening cash + cash sales − refunds − expenses.
 * None of these numbers are "revenue": the drawer only tracks physical cash.
 */
export function drawerTotals(drawer: CashDrawer) {
  const sum = (type: CashEntry["type"]) => drawer.entries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
  const cashSales = sum("sale");
  const cashRefunds = sum("refund");
  const cashExpenses = sum("expense");
  const expectedCash = drawer.openingCash + cashSales - cashRefunds - cashExpenses;
  const difference = drawer.countedCash !== undefined ? drawer.countedCash - expectedCash : undefined;
  return { cashSales, cashRefunds, cashExpenses, expectedCash, difference };
}
