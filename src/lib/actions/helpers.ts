// Small building blocks shared by all actions.

import { DEMO_CONFIG } from "@/data/demo-config";
import type { DemoState } from "@/lib/demo-state";
import { formatOrderId, formatPaymentId, formatQueueNumber, makeId } from "@/lib/order-utils";
import type { AppNotification } from "@/types/notification";
import type { Order, OrderType } from "@/types/order";
import type { AuditLog, StaffRole } from "@/types/people";

/** An action that also gives back a value (e.g. the new order) */
export interface WithResult<T> {
  state: DemoState;
  value: T;
}

export const nowIso = () => new Date().toISOString();

/** Who is signed in on the admin side — used for audit logs and "performed by" */
export function actor(s: DemoState): { user: string; role: StaffRole } {
  const emp = s.employees.find((e) => e.id === s.adminUserId);
  return { user: emp?.name ?? "System", role: emp?.role ?? "owner" };
}

export function auditEntry(s: DemoState, action: string, module: string, details?: string): AuditLog {
  return {
    id: makeId("log"),
    ...actor(s),
    action,
    module,
    details,
    branchId: DEMO_CONFIG.defaultBranchId,
    createdAt: nowIso(),
  };
}

/** Returns a copy of the state with one audit log entry added */
export function withAudit(s: DemoState, action: string, module: string, details?: string): DemoState {
  return { ...s, auditLogs: [auditEntry(s, action, module, details), ...s.auditLogs] };
}

export function notification(data: Omit<AppNotification, "id" | "read" | "createdAt">): AppNotification {
  return { ...data, id: makeId("ntf"), read: false, createdAt: nowIso() };
}

export function withNotifications(s: DemoState, ...items: AppNotification[]): DemoState {
  return { ...s, notifications: [...items, ...s.notifications] };
}

export function findOrder(s: DemoState, orderId: string): Order | undefined {
  return s.orders.find((o) => o.id === orderId);
}

export function updateOrder(s: DemoState, orderId: string, update: (o: Order) => Order): DemoState {
  return { ...s, orders: s.orders.map((o) => (o.id === orderId ? update(o) : o)) };
}

/**
 * Reserves the next Order ID, Payment ID and queue number.
 * Returns the identifiers plus the state with the counters moved forward.
 */
export function reserveIds(s: DemoState, type: OrderType) {
  const queueN = s.queueCounters[type] + 1;
  const ids = {
    orderId: formatOrderId(s.orderSequence),
    paymentId: formatPaymentId(s.orderSequence),
    queueNumber: formatQueueNumber(type, queueN),
  };
  const state: DemoState = {
    ...s,
    orderSequence: s.orderSequence + 1,
    queueCounters: { ...s.queueCounters, [type]: queueN },
  };
  return { ids, state };
}

export function itemsLabel(order: Order): string {
  const n = order.items.reduce((sum, i) => sum + i.quantity, 0);
  return `${n} item${n === 1 ? "" : "s"}`;
}
