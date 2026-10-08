import { choiceRecipes, productRecipes } from "@/data/inventory";
import type { InventoryItem, StockStatus } from "@/types/inventory";
import type { OrderItem } from "@/types/order";

/** Status is calculated from thresholds, so it can never get out of sync with the quantity. */
export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.criticalThreshold) return "critical";
  if (item.quantity <= item.lowStockThreshold) return "low";
  return "healthy";
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  healthy: "Healthy",
  low: "Low Stock",
  critical: "Critical",
  out: "Out of Stock",
};

/** True for low, critical and out of stock */
export function needsAttention(item: InventoryItem): boolean {
  return getStockStatus(item) !== "healthy";
}

/**
 * Adds up how much of each ingredient an order uses, based on the demo recipes.
 * Returns a map of ingredientId → quantity used.
 */
export function ingredientUsage(items: OrderItem[]): Map<string, number> {
  const usage = new Map<string, number>();
  const add = (id: string, amount: number) => usage.set(id, (usage.get(id) ?? 0) + amount);

  for (const item of items) {
    for (const line of productRecipes[item.productId] ?? []) {
      add(line.ingredientId, line.quantity * item.quantity);
    }
    for (const option of item.options) {
      for (const line of choiceRecipes[option.choiceId] ?? []) {
        add(line.ingredientId, line.quantity * item.quantity);
      }
    }
  }
  return usage;
}
