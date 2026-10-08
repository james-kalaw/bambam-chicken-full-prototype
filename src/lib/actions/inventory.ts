// INVENTORY actions (future FastAPI module: "inventory").
// Every stock change creates a movement record — quantities are never
// overwritten silently.

import { DEMO_CONFIG } from "@/data/demo-config";
import type { DemoState } from "@/lib/demo-state";
import { qty } from "@/lib/format";
import { getStockStatus, ingredientUsage, STOCK_STATUS_LABELS } from "@/lib/inventory-utils";
import { makeId } from "@/lib/order-utils";
import type { InventoryTransaction, InventoryTransactionType } from "@/types/inventory";
import type { Order } from "@/types/order";
import { actor, notification, nowIso, withAudit, withNotifications } from "./helpers";

type MovementExtras = Pick<InventoryTransaction, "note" | "relatedOrder" | "purchaseCost" | "supplier" | "receivedDate">;

/**
 * The one place stock quantities change. Updates the quantity, logs the
 * movement, and alerts the owner if the item just became low/critical/out.
 */
function applyStockChange(
  s: DemoState,
  itemId: string,
  change: number,
  type: InventoryTransactionType,
  extras: MovementExtras = {},
  by = actor(s).user,
): DemoState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (!item || change === 0) return s;

  const updated = { ...item, quantity: Math.max(0, Number((item.quantity + change).toFixed(3))), lastUpdated: nowIso() };
  const movement: InventoryTransaction = {
    id: makeId("itx"), itemId, itemName: item.name, type, change, unit: item.unit, by, createdAt: nowIso(), ...extras,
  };
  let next: DemoState = {
    ...s,
    inventory: s.inventory.map((i) => (i.id === itemId ? updated : i)),
    inventoryLog: [movement, ...s.inventoryLog],
  };

  const before = getStockStatus(item);
  const after = getStockStatus(updated);
  if (after !== before && after !== "healthy" && change < 0) {
    next = withNotifications(next, notification({
      audience: "admin",
      title: `${STOCK_STATUS_LABELS[after]}: ${item.name}`,
      message: `${item.name} is now ${qty(updated.quantity)} ${item.unit} (threshold ${qty(item.lowStockThreshold)} ${item.unit}).`,
      tone: "warning",
    }));
  }
  return next;
}

export function recordStockIn(
  s: DemoState,
  itemId: string,
  quantity: number,
  extras: { purchaseCost?: number; supplier?: string; receivedDate?: string; note?: string },
): DemoState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (!item || quantity <= 0) return s;
  const next = applyStockChange(s, itemId, quantity, "Stock In", extras);
  return withAudit(next, "Added stock", "Inventory", `${item.name} +${qty(quantity)} ${item.unit} (${qty(item.quantity)} → ${qty(item.quantity + quantity)})`);
}

/** Physical count differs from the system → set to the counted amount, logging the difference */
export function adjustToCount(s: DemoState, itemId: string, countedQuantity: number, reason: string): DemoState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (!item || countedQuantity < 0) return s;
  const difference = Number((countedQuantity - item.quantity).toFixed(3));
  const next = applyStockChange(s, itemId, difference, "Adjustment", { note: reason });
  return withAudit(next, "Adjusted inventory", "Inventory", `${item.name} ${qty(item.quantity)} → ${qty(countedQuantity)} ${item.unit} (${reason})`);
}

export type StockOutReason = Extract<
  InventoryTransactionType,
  "Waste" | "Spoilage" | "Complimentary Food" | "Staff Meal" | "Damaged" | "Other Stock Out"
>;

export function recordStockOut(s: DemoState, itemId: string, reason: StockOutReason, quantity: number, note?: string): DemoState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (!item || quantity <= 0) return s;
  const next = applyStockChange(s, itemId, -quantity, reason, { note });
  return withAudit(next, `Recorded ${reason.toLowerCase()}`, "Inventory", `${item.name} −${qty(quantity)} ${item.unit}`);
}

/** Owner/manager sets when an item counts as "Low Stock". Critical = half of it (demo rule). */
export function setLowStockThreshold(s: DemoState, itemId: string, threshold: number): DemoState {
  const item = s.inventory.find((i) => i.id === itemId);
  if (!item || threshold < 0) return s;
  const next: DemoState = {
    ...s,
    inventory: s.inventory.map((i) =>
      i.id === itemId ? { ...i, lowStockThreshold: threshold, criticalThreshold: Number((threshold / 2).toFixed(2)) } : i,
    ),
  };
  return withAudit(next, "Changed low-stock threshold", "Inventory", `${item.name}: ${qty(item.lowStockThreshold)} → ${qty(threshold)} ${item.unit}`);
}

/** Called when an order is completed: deducts recipe ingredients (demo quantities) */
export function deductIngredientsForOrder(s: DemoState, order: Order): DemoState {
  if (!DEMO_CONFIG.autoDeductInventoryOnComplete) return s;
  let next = s;
  for (const [ingredientId, used] of ingredientUsage(order.items)) {
    next = applyStockChange(next, ingredientId, -used, "Sale Usage", { relatedOrder: order.queueNumber }, "System");
  }
  return next;
}
