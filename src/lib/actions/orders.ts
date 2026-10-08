// ORDER actions (future FastAPI module: "orders").
//
// ONLINE:  customer submits → owner/cashier notified → Accept/Decline → kitchen
// WALK-IN: cashier enters at the POS → straight to the kitchen (no second approval)
// KITCHEN: Confirmed → Preparing → Completed   (there is no "Ready" status)

import { DEMO_CONFIG } from "@/data/demo-config";
import type { DemoState } from "@/lib/demo-state";
import { peso } from "@/lib/format";
import { CHANNEL_LABELS, itemsSubtotal, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import type { DeliveryDetails, Order, OrderGroup, OrderItem, OrderType, Payment, PaymentMethod, PaymentTiming } from "@/types/order";
import { addCashEntry } from "./cash";
import { recordCustomerPurchase } from "./customers";
import {
  actor, findOrder, itemsLabel, notification, nowIso, reserveIds, updateOrder, withAudit, withNotifications, type WithResult,
} from "./helpers";
import { deductIngredientsForOrder } from "./inventory";
import { submitPaymentProof } from "./payments";

// ── Online orders ────────────────────────────────────────────────────────────

export interface PlaceOrderInput {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  /** Cash is always "pay_later". Electronic methods can be either. */
  timing: PaymentTiming;
  scheduledTime?: string;
  delivery?: DeliveryDetails;
  /** Required when timing is "pay_now" */
  proof?: { proofImageUrl: string; providerReference?: string; submittedAmount: number };
}

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; error: string };

export function placeOnlineOrder(s: DemoState, input: PlaceOrderInput): WithResult<PlaceOrderResult> {
  const fail = (error: string, state = s) => ({ state, value: { ok: false as const, error } });

  // Simulated errors never clear the cart.
  if (!s.onlineOrderingOpen) return fail("Online ordering is temporarily paused.");
  if (s.simulateSubmitError) return fail("Order could not be submitted. Please try again.", { ...s, simulateSubmitError: false });
  const unavailable = s.cart.find((c) => s.products.find((p) => p.id === c.productId)?.availability !== "available");
  if (unavailable) return fail(`${unavailable.productName} became unavailable. Please remove it from your cart.`);
  if (!s.customerSession) return fail("Please sign in first.");
  if (s.cart.length === 0) return fail("Your cart is empty.");
  if (input.timing === "pay_now" && !input.proof) return fail("Please upload your proof of payment.");

  const { ids, state: withIds } = reserveIds(s, input.orderType);
  const subtotal = itemsSubtotal(s.cart);
  const fees = DEMO_CONFIG.onlineServiceFee;
  const timing: PaymentTiming = input.paymentMethod === "cash" ? "pay_later" : input.timing;
  const payment: Payment = { id: ids.paymentId, method: input.paymentMethod, status: "unpaid", timing, amountDue: subtotal + fees };

  const order: Order = {
    id: ids.orderId,
    queueNumber: ids.queueNumber,
    customerId: s.customerSession.customerId,
    customerName: s.customerSession.name,
    channel: "online",
    orderType: input.orderType,
    items: s.cart,
    subtotal,
    fees,
    total: subtotal + fees,
    orderStatus: "pending_confirmation",
    payment,
    scheduledTime: input.scheduledTime,
    delivery: input.delivery,
    branchId: DEMO_CONFIG.defaultBranchId,
    createdAt: nowIso(),
  };

  // Notify owner/cashier only. The kitchen is NOT notified until accepted.
  let next: DemoState = { ...withIds, orders: [order, ...withIds.orders], cart: [] };
  next = withNotifications(
    next,
    notification({
      audience: "admin",
      title: "New online order",
      message: `${order.queueNumber} · ${ORDER_TYPE_LABELS[order.orderType]}${order.scheduledTime ? ` ${order.scheduledTime}` : ""} · ${itemsLabel(order)} · ${peso(order.total)}`,
      tone: "info",
      orderId: order.id,
    }),
    notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Order submitted",
      message: `${order.queueNumber} is waiting for confirmation from Bambam.`,
      tone: "info",
      orderId: order.id,
    }),
  );
  // Pay Now: the proof is attached right away → payment becomes "Pending Verification"
  if (timing === "pay_now" && input.proof) next = submitPaymentProof(next, order.id, input.proof);

  const saved = findOrder(next, order.id) ?? order;
  return { state: next, value: { ok: true, order: saved } };
}

// ── Walk-in orders (POS) ─────────────────────────────────────────────────────

export interface WalkInOrderInput {
  items: OrderItem[];
  /** Only for group orders */
  groups?: OrderGroup[];
  orderType: OrderType;
  /** null = Guest / Walk-in. Linking a known customer is optional. */
  customer: { id: string; name: string } | null;
  payment: {
    method: PaymentMethod;
    /** false = "Pay later" (unpaid) */
    paid: boolean;
    cashReceived?: number;
    providerReference?: string;
  };
}

export function createWalkInOrder(s: DemoState, input: WalkInOrderInput): WithResult<Order> {
  const { ids, state: withIds } = reserveIds(s, input.orderType);
  const total = itemsSubtotal(input.items);
  const now = nowIso();
  const { method, paid, cashReceived, providerReference } = input.payment;
  const cash = method === "cash";
  const by = actor(s).user;

  const payment: Payment = {
    id: ids.paymentId,
    method,
    status: paid ? "paid" : "unpaid",
    timing: paid ? "pay_now" : "pay_later",
    amountDue: total,
    amountPaid: paid ? total : undefined,
    cashReceived: paid && cash ? cashReceived : undefined,
    changeGiven: paid && cash && cashReceived !== undefined ? cashReceived - total : undefined,
    providerReference: paid && !cash ? providerReference || undefined : undefined,
    paidAt: paid ? now : undefined,
    // Walk-in GCash: the cashier saw the success screen and tapped "Mark payment verified"
    verifiedAt: paid && !cash ? now : undefined,
    verifiedBy: paid && !cash ? by : undefined,
  };

  const groups = input.groups && input.groups.length > 1 ? input.groups : undefined;
  const order: Order = {
    id: ids.orderId,
    queueNumber: ids.queueNumber,
    customerId: input.customer?.id,
    customerName: input.customer?.name,
    channel: "walk_in",
    orderType: input.orderType,
    groups,
    items: groups ? input.items : input.items.map((i) => ({ ...i, groupId: undefined })),
    subtotal: total,
    fees: 0,
    total,
    // Walk-in orders are taken by staff, so they go straight to the kitchen
    orderStatus: "confirmed",
    payment,
    branchId: DEMO_CONFIG.defaultBranchId,
    createdAt: now,
    confirmedAt: now,
  };

  let next: DemoState = { ...withIds, orders: [order, ...withIds.orders] };
  next = withNotifications(next, notification({
    audience: "kitchen",
    title: "New order to prepare",
    message: `${order.queueNumber} · ${CHANNEL_LABELS.walk_in} · ${ORDER_TYPE_LABELS[order.orderType]} · ${itemsLabel(order)}${groups ? ` · ${groups.length} people` : ""}`,
    tone: "info",
    orderId: order.id,
  }));
  if (paid && cash) next = addCashEntry(next, { type: "sale", amount: total, orderId: order.id, queueNumber: order.queueNumber });
  if (input.customer) {
    next = withAudit(next, "Linked customer to walk-in order", "Orders", `${order.queueNumber} → ${input.customer.id} (${input.customer.name})`);
  }
  if (paid && !cash) {
    next = withAudit(next, "Verified payment", "Payments", `${order.queueNumber} · ${PAYMENT_METHOD_LABELS[method]} shown at counter · ${peso(total)}`);
  }
  return { state: next, value: order };
}

// ── Owner confirmation ───────────────────────────────────────────────────────

export function acceptOrder(s: DemoState, orderId: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order || order.orderStatus !== "pending_confirmation") return s;
  let next = updateOrder(s, orderId, (o) => ({ ...o, orderStatus: "confirmed", confirmedAt: nowIso() }));
  next = withNotifications(
    next,
    notification({
      audience: "kitchen",
      title: "New order to prepare",
      message: `${order.queueNumber} · ${CHANNEL_LABELS.online} · ${ORDER_TYPE_LABELS[order.orderType]}${order.scheduledTime ? ` ${order.scheduledTime}` : ""} · ${itemsLabel(order)}`,
      tone: "info",
      orderId,
    }),
    notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Order confirmed!",
      message: `Bam! ${order.queueNumber} has been confirmed and sent to the kitchen.`,
      tone: "success",
      orderId,
    }),
  );
  return withAudit(next, "Accepted online order", "Orders", order.queueNumber);
}

export function declineOrder(s: DemoState, orderId: string, reason: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order || order.orderStatus !== "pending_confirmation") return s;
  let next = updateOrder(s, orderId, (o) => ({ ...o, orderStatus: "declined", declineReason: reason }));
  next = withNotifications(next, notification({
    audience: "customer",
    customerId: order.customerId,
    title: "Order could not be accepted",
    message: `Sorry, ${order.queueNumber} was declined: ${reason}.`,
    tone: "error",
    orderId,
  }));
  return withAudit(next, "Declined online order", "Orders", `${order.queueNumber} — ${reason}`);
}

// ── Kitchen ──────────────────────────────────────────────────────────────────

export function startPreparing(s: DemoState, orderId: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order || order.orderStatus !== "confirmed") return s;
  let next = updateOrder(s, orderId, (o) => ({ ...o, orderStatus: "preparing", preparingAt: nowIso() }));
  if (order.customerId && order.channel === "online") {
    next = withNotifications(next, notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Preparing your order",
      message: `${order.queueNumber} is now being prepared.`,
      tone: "info",
      orderId,
    }));
  }
  return next;
}

/**
 * Completing an order:
 * 1. deducts recipe ingredients from inventory (demo quantities)
 * 2. adds the purchase to a KNOWN customer's history (guests: nothing)
 * 3. tells an online customer it's done
 */
export function completeOrder(s: DemoState, orderId: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order || (order.orderStatus !== "preparing" && order.orderStatus !== "confirmed")) return s;
  const now = nowIso();
  const completed: Order = { ...order, orderStatus: "completed", completedAt: now, preparingAt: order.preparingAt ?? now };

  let next = updateOrder(s, orderId, () => completed);
  next = deductIngredientsForOrder(next, completed);
  next = recordCustomerPurchase(next, completed);
  if (order.customerId && order.channel === "online") {
    next = withNotifications(next, notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Order completed!",
      message: `${order.queueNumber} is complete. Enjoy your Bambam!`,
      tone: "success",
      orderId,
    }));
  }
  return next;
}
