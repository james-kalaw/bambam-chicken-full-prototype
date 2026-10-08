import { DEMO_CONFIG } from "@/data/demo-config";
import { DEMO_PROOF_IMAGE } from "@/data/payments";
import { buildOrderItem, formatOrderId, formatPaymentId, itemsSubtotal } from "@/lib/order-utils";
import type { Order, OrderGroup, OrderItem, OrderType, Payment, PaymentMethod, PaymentStatus, PaymentTiming } from "@/types/order";

// DEMO ORDERS — fictional. Times are relative to "now" so the demo always
// looks like it is happening today.

/**
 * Last queue number used per order type. The next orders become
 * D-052, T-052, P-028 and DL-006, matching the pitch scripts.
 */
export const INITIAL_QUEUE_COUNTERS: Record<OrderType, number> = {
  dine_in: 51,
  takeout: 51,
  pickup: 27,
  delivery: 5,
};

/** Next internal order number → ORD-YYYYMMDD-00152 */
export const INITIAL_ORDER_SEQUENCE = 152;

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d: number, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

interface SeedPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  timing?: PaymentTiming;
  cashReceived?: number;
  providerReference?: string;
  proof?: boolean;
}

interface SeedOrder extends Omit<Order, "id" | "subtotal" | "fees" | "total" | "branchId" | "payment"> {
  seq: number;
  pay: SeedPayment;
}

/** Fills in IDs, totals and the payment record for a seed order */
function order({ seq, pay, ...rest }: SeedOrder): Order {
  const created = new Date(rest.createdAt);
  const total = itemsSubtotal(rest.items);
  const paid = pay.status === "paid";
  const payment: Payment = {
    id: formatPaymentId(seq, created),
    method: pay.method,
    status: pay.status,
    timing: pay.timing ?? "pay_later",
    amountDue: total,
    amountPaid: paid ? total : undefined,
    cashReceived: pay.cashReceived,
    changeGiven: pay.cashReceived !== undefined ? pay.cashReceived - total : undefined,
    providerReference: pay.providerReference,
    proofImageUrl: pay.proof ? DEMO_PROOF_IMAGE : undefined,
    submittedAmount: pay.proof ? total : undefined,
    submittedAt: pay.proof ? rest.createdAt : undefined,
    paidAt: paid ? rest.completedAt ?? rest.confirmedAt ?? rest.createdAt : undefined,
  };
  return { ...rest, id: formatOrderId(seq, created), subtotal: total, fees: 0, total, payment, branchId: DEMO_CONFIG.defaultBranchId };
}

/** Helper: items for one person in a group order */
function person(groupId: string, items: OrderItem[]): OrderItem[] {
  return items.map((i) => ({ ...i, groupId }));
}

export function createSeedOrders(): Order[] {
  const threePeople: OrderGroup[] = [
    { id: "g1", label: "Person 1" },
    { id: "g2", label: "Person 2" },
    { id: "g3", label: "Person 3" },
  ];

  return [
    // ── Online order waiting for confirmation, GCash proof waiting for verification ──
    order({
      seq: 151,
      queueNumber: "DL-005",
      customerId: "CUS-000391",
      customerName: "Mika Fernandez",
      channel: "online",
      orderType: "delivery",
      items: [
        buildOrderItem("chicken-poppers", ["rice-meal", "honey-butter", "cheese-sauce"], 2),
        buildOrderItem("matcha-latte", ["iced", "regular"], 1),
      ],
      orderStatus: "pending_confirmation",
      pay: { method: "gcash", status: "pending_verification", timing: "pay_now", providerReference: "8012345678", proof: true },
      delivery: {
        name: "Mika Fernandez",
        mobile: "09281234890",
        address: "Dorm B, Room 304, near the university gate",
        landmark: "Beside the 24/7 convenience store",
        instructions: "Please call when outside",
      },
      createdAt: minsAgo(3),
    }),

    // ── In the kitchen ──
    order({
      seq: 148,
      queueNumber: "P-027",
      customerId: "CUS-000512",
      customerName: "Paolo Lim",
      channel: "online",
      orderType: "pickup",
      items: [
        buildOrderItem("chicken-chops", ["rice-meal", "garlic-parmesan", "garlic-mayo", "extra-rice"], 2),
        buildOrderItem("latte", ["iced", "regular", "coffee-jelly"], 1),
      ],
      orderStatus: "preparing",
      pay: { method: "cash", status: "unpaid" },
      scheduledTime: "12:15 PM",
      createdAt: minsAgo(14),
      confirmedAt: minsAgo(12),
      preparingAt: minsAgo(6),
    }),
    order({
      seq: 149,
      queueNumber: "D-051",
      channel: "walk_in",
      orderType: "dine_in",
      groups: threePeople,
      items: [
        ...person("g1", [buildOrderItem("chicken-chops", ["rice-meal", "soy-garlic", "garlic-mayo"], 1)]),
        ...person("g2", [buildOrderItem("chicken-sisig", ["regular", "fried-egg"], 1)]),
        ...person("g3", [buildOrderItem("iced-tea", ["regular"], 1)]),
      ],
      orderStatus: "confirmed",
      pay: { method: "cash", status: "paid", cashReceived: 500 },
      createdAt: minsAgo(5),
      confirmedAt: minsAgo(5),
    }),
    order({
      seq: 150,
      queueNumber: "T-051",
      channel: "walk_in",
      orderType: "takeout",
      items: [buildOrderItem("chicken-chops", ["a-la-carte", "buffalo", "sweet-chili"], 1)],
      orderStatus: "confirmed",
      pay: { method: "gcash", status: "paid" },
      createdAt: minsAgo(2),
      confirmedAt: minsAgo(2),
    }),

    // ── Completed earlier today ──
    order({
      seq: 146,
      queueNumber: "D-050",
      customerId: "CUS-000428",
      customerName: "Alex Dela Cruz",
      channel: "walk_in",
      orderType: "dine_in",
      items: [
        buildOrderItem("chicken-chops", ["rice-meal", "honey-butter", "garlic-mayo"], 1),
        buildOrderItem("spanish-latte", ["iced", "regular"], 1),
      ],
      orderStatus: "completed",
      pay: { method: "cash", status: "paid", cashReceived: 300 },
      createdAt: minsAgo(40),
      confirmedAt: minsAgo(40),
      preparingAt: minsAgo(38),
      completedAt: minsAgo(30),
    }),
    order({
      seq: 145,
      queueNumber: "T-050",
      channel: "walk_in",
      orderType: "takeout",
      items: [buildOrderItem("chicken-poppers", ["a-la-carte", "garlic-parmesan", "garlic-mayo"], 3)],
      orderStatus: "completed",
      pay: { method: "maya", status: "paid" },
      createdAt: minsAgo(55),
      confirmedAt: minsAgo(55),
      preparingAt: minsAgo(52),
      completedAt: minsAgo(45),
    }),
    order({
      seq: 143,
      queueNumber: "P-026",
      customerId: "CUS-000207",
      customerName: "Jessa Cruz",
      channel: "online",
      orderType: "pickup",
      items: [buildOrderItem("chicken-chops", ["rice-meal", "salted-egg", "cheese-sauce"], 1)],
      orderStatus: "completed",
      pay: { method: "gcash", status: "paid", timing: "pay_now", providerReference: "8009876543" },
      scheduledTime: "ASAP",
      createdAt: minsAgo(80),
      confirmedAt: minsAgo(78),
      preparingAt: minsAgo(75),
      completedAt: minsAgo(66),
    }),
    order({
      seq: 142,
      queueNumber: "DL-004",
      customerId: "CUS-000318",
      customerName: "Rafael Tan",
      channel: "online",
      orderType: "delivery",
      items: [buildOrderItem("chicken-sisig", ["spicy"], 2)],
      orderStatus: "declined",
      pay: { method: "cash", status: "unpaid" },
      declineReason: "Store temporarily at capacity",
      delivery: { name: "Rafael Tan", mobile: "09175550123", address: "Unit 5, Aurora Residences" },
      createdAt: minsAgo(95),
    }),

    // ── Past orders of the demo customer (CUS-000428): online AND linked walk-in ──
    order({
      seq: 131,
      queueNumber: "P-019",
      customerId: "CUS-000428",
      customerName: "Alex Dela Cruz",
      channel: "online",
      orderType: "pickup",
      items: [
        buildOrderItem("chicken-chops", ["rice-meal", "garlic-parmesan", "garlic-mayo"], 1),
        buildOrderItem("latte", ["iced", "regular", "coffee-jelly"], 1),
      ],
      orderStatus: "completed",
      pay: { method: "cash", status: "paid" },
      scheduledTime: "12:30 PM",
      createdAt: daysAgo(2, 12),
      completedAt: daysAgo(2, 12),
    }),
    order({
      seq: 117,
      queueNumber: "D-033",
      customerId: "CUS-000428",
      customerName: "Alex Dela Cruz",
      channel: "walk_in",
      orderType: "dine_in",
      items: [buildOrderItem("chicken-chops", ["rice-meal", "garlic-parmesan", "cheese-sauce", "fried-egg"], 1)],
      orderStatus: "completed",
      pay: { method: "cash", status: "paid" },
      createdAt: daysAgo(4, 13),
      completedAt: daysAgo(4, 13),
    }),
    order({
      seq: 98,
      queueNumber: "T-028",
      customerId: "CUS-000428",
      customerName: "Alex Dela Cruz",
      channel: "online",
      orderType: "takeout",
      items: [buildOrderItem("chicken-poppers", ["rice-meal", "garlic-parmesan", "cheese-sauce", "fries"], 1)],
      orderStatus: "completed",
      pay: { method: "gcash", status: "paid", timing: "pay_now", providerReference: "8001112233" },
      createdAt: daysAgo(6, 17),
      completedAt: daysAgo(6, 17),
    }),
  ];
}
