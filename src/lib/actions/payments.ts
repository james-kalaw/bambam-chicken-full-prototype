// PAYMENT actions (future FastAPI module: "payments").
//
// Rules:
// - Choosing GCash/Maya does NOT make an order paid. Someone must verify it.
// - A cash sale is recorded at the ORDER TOTAL. Cash received and change are
//   only kept for the receipt and the cash drawer check.

import type { DemoState } from "@/lib/demo-state";
import { peso } from "@/lib/format";
import { isElectronic, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-utils";
import type { PaymentMethod } from "@/types/order";
import { addCashEntry } from "./cash";
import { actor, findOrder, notification, nowIso, updateOrder, withAudit, withNotifications } from "./helpers";

/** Online customer sends proof of payment (screenshot + optional reference) */
export function submitPaymentProof(
  s: DemoState,
  orderId: string,
  proof: { proofImageUrl: string; providerReference?: string; submittedAmount: number },
): DemoState {
  const order = findOrder(s, orderId);
  if (!order) return s;
  let next = updateOrder(s, orderId, (o) => ({
    ...o,
    payment: {
      ...o.payment,
      timing: "pay_now",
      status: "pending_verification",
      proofImageUrl: proof.proofImageUrl,
      providerReference: proof.providerReference || undefined,
      submittedAmount: proof.submittedAmount,
      submittedAt: nowIso(),
      issueNote: undefined,
    },
  }));
  next = withNotifications(
    next,
    notification({
      audience: "admin",
      title: "Payment to verify",
      message: `${order.queueNumber} · ${PAYMENT_METHOD_LABELS[order.payment.method]} · ${peso(order.total)} — proof of payment submitted`,
      tone: "info",
      orderId,
    }),
  );
  return next;
}

/** Owner/cashier checked the proof (or the customer's phone) and confirms the money arrived */
export function verifyPayment(s: DemoState, orderId: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order) return s;
  const by = actor(s).user;
  let next = updateOrder(s, orderId, (o) => ({
    ...o,
    payment: { ...o.payment, status: "paid", amountPaid: o.total, paidAt: nowIso(), verifiedAt: nowIso(), verifiedBy: by, issueNote: undefined },
  }));
  if (order.customerId && order.channel === "online") {
    next = withNotifications(next, notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Payment verified",
      message: `We received your ${PAYMENT_METHOD_LABELS[order.payment.method]} payment for ${order.queueNumber}.`,
      tone: "success",
      orderId,
    }));
  }
  return withAudit(next, "Verified payment", "Payments", `${order.queueNumber} · ${order.payment.id} · ${peso(order.total)}`);
}

/** Proof doesn't match (wrong amount, unreadable, not received) */
export function markPaymentIssue(s: DemoState, orderId: string, note: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order) return s;
  let next = updateOrder(s, orderId, (o) => ({ ...o, payment: { ...o.payment, status: "payment_issue", issueNote: note } }));
  if (order.customerId) {
    next = withNotifications(next, notification({
      audience: "customer",
      customerId: order.customerId,
      title: "Payment issue",
      message: `There's a problem with the payment for ${order.queueNumber}: ${note}`,
      tone: "error",
      orderId,
    }));
  }
  return withAudit(next, "Marked payment issue", "Payments", `${order.queueNumber} — ${note}`);
}

export interface CollectPaymentInput {
  method: PaymentMethod;
  /** Cash only */
  cashReceived?: number;
  /** Electronic only, optional */
  providerReference?: string;
}

/**
 * Cashier collects payment in person — e.g. an online "Cash at Pickup" order
 * when the customer arrives, or a walk-in who shows their GCash success screen.
 */
export function collectPayment(s: DemoState, orderId: string, input: CollectPaymentInput): DemoState {
  const order = findOrder(s, orderId);
  if (!order) return s;
  const cash = input.method === "cash";
  if (cash && (input.cashReceived ?? 0) < order.total) return s;
  const by = actor(s).user;

  let next = updateOrder(s, orderId, (o) => ({
    ...o,
    payment: {
      ...o.payment,
      method: input.method,
      status: "paid",
      amountPaid: o.total,
      cashReceived: cash ? input.cashReceived : undefined,
      changeGiven: cash ? (input.cashReceived ?? 0) - o.total : undefined,
      providerReference: !cash ? input.providerReference || o.payment.providerReference : undefined,
      paidAt: nowIso(),
      verifiedAt: isElectronic(input.method) ? nowIso() : undefined,
      verifiedBy: isElectronic(input.method) ? by : undefined,
    },
  }));
  // Physical cash goes into the drawer — at the ORDER TOTAL, not the cash handed over
  if (cash) next = addCashEntry(next, { type: "sale", amount: order.total, orderId, queueNumber: order.queueNumber });
  return next;
}

export function refundPayment(s: DemoState, orderId: string): DemoState {
  const order = findOrder(s, orderId);
  if (!order || order.payment.status !== "paid") return s;
  let next = updateOrder(s, orderId, (o) => ({ ...o, payment: { ...o.payment, status: "refunded" } }));
  if (order.payment.method === "cash") {
    next = addCashEntry(next, { type: "refund", amount: order.total, orderId, queueNumber: order.queueNumber, note: "Order refunded" });
  }
  return withAudit(
    next,
    "Refunded order",
    "Payments",
    `${order.queueNumber}: ${PAYMENT_STATUS_LABELS.paid} → ${PAYMENT_STATUS_LABELS.refunded} (${peso(order.total)}, ${PAYMENT_METHOD_LABELS[order.payment.method]})`,
  );
}
