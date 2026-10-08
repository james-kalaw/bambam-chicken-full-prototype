import { TODAY_BASELINE } from "@/data/analytics";
import { getProduct, isElectronic, isToday } from "@/lib/order-utils";
import type { Order, OrderType, PaymentMethod } from "@/types/order";

// Turns the live order list + baseline demo numbers into dashboard figures.
//
// Revenue = total of COMPLETED orders (Completed Sales = Revenue).
// It is split by payment method into Cash Revenue + Electronic Revenue.
// The cash DRAWER is a separate figure (see lib/cash-utils.ts).
// Guest walk-ins count fully toward sales — customer identity isn't needed.

export interface TodayStats {
  revenue: number;
  cashRevenue: number;
  electronicRevenue: number;
  orders: number;
  aov: number;
  online: number;
  walkIn: number;
  /** Orders linked to a known customer vs guest transactions (NOT unique people) */
  knownCustomerOrders: number;
  guestOrders: number;
  pending: number;
  paymentsToVerify: number;
  inKitchen: number;
  /** Live orders added during this demo session (for "incl. N live" hints) */
  liveRevenue: number;
  liveCashRevenue: number;
  liveElectronicRevenue: number;
  liveOrders: number;
  byType: Record<OrderType, number>;
  byPayment: Record<PaymentMethod, number>;
  topProducts: { productId: string; name: string; units: number }[];
}

export function getTodayStats(orders: Order[]): TodayStats {
  const todays = orders.filter((o) => isToday(o.createdAt) && o.orderStatus !== "declined");
  const completed = todays.filter((o) => o.orderStatus === "completed");
  const sumTotals = (list: Order[]) => list.reduce((s, o) => s + o.total, 0);

  const liveRevenue = sumTotals(completed);
  const liveCashRevenue = sumTotals(completed.filter((o) => o.payment.method === "cash"));
  const liveElectronicRevenue = sumTotals(completed.filter((o) => isElectronic(o.payment.method)));
  const revenue = TODAY_BASELINE.revenue + liveRevenue;
  const orderCount = TODAY_BASELINE.orders + todays.length;

  const byType = { ...TODAY_BASELINE.byType };
  const byPayment = { ...TODAY_BASELINE.byPayment };
  const units: Record<string, number> = { ...TODAY_BASELINE.productUnits };
  for (const o of todays) {
    byType[o.orderType] += 1;
    byPayment[o.payment.method] += 1;
  }
  for (const o of completed) {
    for (const item of o.items) units[item.productId] = (units[item.productId] ?? 0) + item.quantity;
  }

  const topProducts = Object.entries(units)
    .map(([productId, u]) => ({ productId, name: getProduct(productId)?.name ?? productId, units: u }))
    .sort((a, b) => b.units - a.units);

  return {
    revenue,
    cashRevenue: TODAY_BASELINE.cashRevenue + liveCashRevenue,
    electronicRevenue: TODAY_BASELINE.electronicRevenue + liveElectronicRevenue,
    orders: orderCount,
    aov: orderCount ? revenue / orderCount : 0,
    online: TODAY_BASELINE.online + todays.filter((o) => o.channel === "online").length,
    walkIn: TODAY_BASELINE.walkIn + todays.filter((o) => o.channel === "walk_in").length,
    knownCustomerOrders: TODAY_BASELINE.knownCustomerOrders + todays.filter((o) => o.customerId).length,
    guestOrders: TODAY_BASELINE.guestOrders + todays.filter((o) => !o.customerId).length,
    pending: orders.filter((o) => o.orderStatus === "pending_confirmation").length,
    paymentsToVerify: orders.filter((o) => o.payment.status === "pending_verification").length,
    inKitchen: orders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing").length,
    liveRevenue,
    liveCashRevenue,
    liveElectronicRevenue,
    liveOrders: todays.length,
    byType,
    byPayment,
    topProducts,
  };
}
