// Cash drawer = the PHYSICAL cash in the register. It is NOT the same as sales:
// - Opening cash (the starting float) is not revenue.
// - Change given back to customers is not revenue.
// - A cash sale is recorded at the ORDER TOTAL, not the amount handed over.

export type CashEntryType = "sale" | "refund" | "expense";

export interface CashEntry {
  id: string;
  type: CashEntryType;
  /** Always positive. Sales add to the drawer; refunds and expenses remove from it. */
  amount: number;
  orderId?: string;
  queueNumber?: string;
  note?: string;
  by: string;
  createdAt: string;
}

export interface CashDrawer {
  status: "open" | "closed";
  openingCash: number;
  openedAt: string;
  openedBy: string;
  closedAt?: string;
  closedBy?: string;
  /** Cash physically counted at closing */
  countedCash?: number;
  entries: CashEntry[];
}
