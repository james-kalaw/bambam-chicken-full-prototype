import type { OrderType, PaymentMethod } from "@/types/order";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO ANALYTICS — fictional numbers for the pitch.
// "Baseline" numbers represent historical orders that are not in the live
// order list. Orders placed during the demo are added on top of these.
// ─────────────────────────────────────────────────────────────────────────────

/** Orders earlier today (before the live demo orders) */
export const TODAY_BASELINE = {
  revenue: 23_215,
  /** Revenue split by how it was paid (cash + electronic = revenue) */
  cashRevenue: 14_350,
  electronicRevenue: 8_865,
  orders: 176,
  online: 44,
  walkIn: 132,
  /** Orders linked to a known customer ID vs guest transactions (not unique people!) */
  knownCustomerOrders: 61,
  guestOrders: 115,
  byType: { dine_in: 70, takeout: 62, pickup: 27, delivery: 17 } satisfies Record<OrderType, number>,
  byPayment: { cash: 106, gcash: 55, maya: 10, bank_transfer: 4, other_online: 1 } satisfies Record<PaymentMethod, number>,
  /** Units sold per product today */
  productUnits: {
    "chicken-chops": 61,
    "chicken-poppers": 39,
    latte: 31,
    "chicken-sisig": 21,
    "matcha-latte": 17,
    "spanish-latte": 15,
    fries: 14,
    "iced-tea": 12,
  } as Record<string, number>,
};

/** Revenue for the last 7 days. Last value = today's baseline. */
export const LAST_7_DAYS_REVENUE = [19_840, 22_310, 25_960, 27_480, 21_150, 18_420, TODAY_BASELINE.revenue];
export const LAST_7_DAYS_ORDERS = [151, 170, 197, 209, 161, 140, TODAY_BASELINE.orders];

/** Orders per hour today — peaks follow school breaks */
export const HOURLY_ORDERS = [
  { hour: "9 AM", orders: 6 },
  { hour: "10 AM", orders: 11 },
  { hour: "11 AM", orders: 24 },
  { hour: "12 PM", orders: 38 },
  { hour: "1 PM", orders: 29 },
  { hour: "2 PM", orders: 12 },
  { hour: "3 PM", orders: 9 },
  { hour: "4 PM", orders: 14 },
  { hour: "5 PM", orders: 21 },
  { hour: "6 PM", orders: 12 },
];

/** Demo-only cost ratio used for "Estimated Cost". NOT real Bambam costs. */
export const DEMO_COST_RATIO = 0.42;

export type AnalyticsPeriod = "today" | "week" | "month";

/** Baseline totals for longer periods (today's live orders get added on top) */
export interface PeriodTotals {
  revenue: number;
  cashRevenue: number;
  electronicRevenue: number;
  orders: number;
  online: number;
  walkIn: number;
  knownCustomerOrders: number;
  guestOrders: number;
  byType: Record<OrderType, number>;
  byPayment: Record<PaymentMethod, number>;
}

export const PERIOD_BASELINE: Record<Exclude<AnalyticsPeriod, "today">, PeriodTotals> = {
  week: {
    revenue: 158_375,
    cashRevenue: 97_900,
    electronicRevenue: 60_475,
    orders: LAST_7_DAYS_ORDERS.reduce((a, b) => a + b, 0),
    online: 302,
    walkIn: 902,
    knownCustomerOrders: 431,
    guestOrders: 773,
    byType: { dine_in: 488, takeout: 414, pickup: 196, delivery: 106 },
    byPayment: { cash: 724, gcash: 371, maya: 70, bank_transfer: 30, other_online: 9 },
  },
  month: {
    revenue: 426_000,
    cashRevenue: 262_400,
    electronicRevenue: 163_600,
    orders: 3_050,
    online: 790,
    walkIn: 2_260,
    knownCustomerOrders: 1_105,
    guestOrders: 1_945,
    byType: { dine_in: 1_240, takeout: 1_020, pickup: 512, delivery: 278 },
    byPayment: { cash: 1_830, gcash: 940, maya: 185, bank_transfer: 70, other_online: 25 },
  },
};

/** Weekly revenue for the current month (Growth / Sales tabs) */
export const MONTH_WEEKLY_REVENUE = [
  { label: "Week 1", revenue: 98_400 },
  { label: "Week 2", revenue: 104_900 },
  { label: "Week 3", revenue: 109_300 },
  { label: "Week 4", revenue: 113_400 },
];

/** Previous month vs this month (example from the proposal) */
export const MONTH_COMPARISON = [
  { metric: "Sales", previous: 380_000, current: 426_000, format: "currency" as const, goodWhen: "up" as const },
  { metric: "Orders", previous: 2_890, current: 3_050, format: "number" as const, goodWhen: "up" as const },
  { metric: "Average Order", previous: 131, current: 140, format: "currency" as const, goodWhen: "up" as const },
  { metric: "Waste", previous: 18_000, current: 13_000, format: "currency" as const, goodWhen: "down" as const },
];

export const MONTHLY_REVENUE_TREND = [
  { month: "May", revenue: 298_000 },
  { month: "Jun", revenue: 241_000 },
  { month: "Jul", revenue: 312_000 },
  { month: "Aug", revenue: 355_000 },
  { month: "Sep", revenue: 380_000 },
  { month: "Oct", revenue: 426_000 },
];

export const CUSTOMER_STATS = {
  totalCustomers: 1_284,
  newThisMonth: 186,
  returningRate: 0.58,
  avgOrdersPerCustomer: 3.4,
  avgSpendPerCustomer: 412,
  weekly: [
    { week: "Week 1", new: 41, returning: 212 },
    { week: "Week 2", new: 47, returning: 236 },
    { week: "Week 3", new: 52, returning: 251 },
    { week: "Week 4", new: 46, returning: 268 },
  ],
  segments: [
    { segment: "New", count: 186 },
    { segment: "Returning", count: 512 },
    { segment: "Frequent", count: 304 },
    { segment: "High Value", count: 92 },
    { segment: "Inactive", count: 190 },
  ],
  repeatFavorites: [
    { product: "Chicken Chops", share: 0.41 },
    { product: "Chicken Poppers", share: 0.24 },
    { product: "Bam Brew Latte", share: 0.15 },
    { product: "Matcha Latte", share: 0.11 },
  ],
};

/** Inventory movement value by reason, this month (₱, demo) */
export const INVENTORY_LOSSES = [
  { reason: "Waste", value: 7_400 },
  { reason: "Spoilage", value: 3_100 },
  { reason: "Staff Meal", value: 1_650 },
  { reason: "Complimentary", value: 850 },
];

export const WEEKLY_WASTE = [
  { week: "Week 1", value: 4_100 },
  { week: "Week 2", value: 3_400 },
  { week: "Week 3", value: 2_900 },
  { week: "Week 4", value: 2_600 },
];
