import { PRODUCTS } from "@/data/products";
import type {
  Order, OrderChannel, OrderGroup, OrderItem, OrderStatus, OrderType, PaymentMethod, PaymentStatus,
} from "@/types/order";
import type { Product, SelectedOption } from "@/types/product";

// ── Labels ───────────────────────────────────────────────────────────────────

export const CHANNEL_LABELS: Record<OrderChannel, string> = {
  online: "Online",
  walk_in: "Walk-in",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine-In",
  takeout: "Takeout",
  pickup: "Pickup",
  delivery: "Delivery",
};

/** Each order type has its own customer-facing number prefix */
export const ORDER_PREFIXES: Record<OrderType, string> = {
  dine_in: "D",
  takeout: "T",
  pickup: "P",
  delivery: "DL",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Waiting for confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  completed: "Completed",
  declined: "Declined",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending_verification: "Pending Verification",
  paid: "Paid",
  payment_issue: "Payment Issue",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  gcash: "GCash",
  maya: "Maya",
  bank_transfer: "Bank Transfer",
  other_online: "Other Online Payment",
};

/** GCash, Maya, bank transfer… everything that isn't physical cash */
export function isElectronic(method: PaymentMethod): boolean {
  return method !== "cash";
}

/** "Cash at Pickup", "GCash (Pay Now)", "GCash (Pay Later)", "Cash" */
export function paymentMethodText(order: Order): string {
  const { method, timing } = order.payment;
  if (method === "cash") {
    if (order.channel === "walk_in") return "Cash";
    return order.orderType === "pickup" ? "Cash at Pickup" : order.orderType === "delivery" ? "Cash on Delivery" : "Cash at Counter";
  }
  if (order.channel === "walk_in") return PAYMENT_METHOD_LABELS[method];
  return `${PAYMENT_METHOD_LABELS[method]} (${timing === "pay_now" ? "Pay Now" : "Pay Later"})`;
}

// ── IDs ──────────────────────────────────────────────────────────────────────

/** 2026-10-08 → "20261008" */
function datePart(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}${m}${d}`;
}

/** Internal order ID: ORD-20261008-00152 */
export function formatOrderId(sequence: number, date = new Date()): string {
  return `ORD-${datePart(date)}-${String(sequence).padStart(5, "0")}`;
}

/** Internal payment ID: PAY-20261008-00152 (same number as its order, for easy matching) */
export function formatPaymentId(sequence: number, date = new Date()): string {
  return `PAY-${datePart(date)}-${String(sequence).padStart(5, "0")}`;
}

/** e.g. formatQueueNumber("pickup", 28) → "P-028" */
export function formatQueueNumber(type: OrderType, n: number): string {
  return `${ORDER_PREFIXES[type]}-${String(n).padStart(3, "0")}`;
}

/** Short random id for things that don't need a readable number (cart lines, notifications…) */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Prices & items ───────────────────────────────────────────────────────────

export function getProduct(productId: string, products: Product[] = PRODUCTS): Product | undefined {
  return products.find((p) => p.id === productId);
}

export function calcUnitPrice(basePrice: number, options: SelectedOption[]): number {
  return basePrice + options.reduce((sum, o) => sum + o.priceDelta, 0);
}

export function lineTotal(item: OrderItem): number {
  return item.unitPrice * item.quantity;
}

export function itemsSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function itemCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Short summary like "Rice Meal · Creamy Garlic Parmesan · Garlic Mayo" */
export function optionsSummary(options: SelectedOption[]): string {
  return options.map((o) => o.choiceLabel).join(" · ");
}

/**
 * Builds an order line from a product id and a list of choice ids.
 * Pass `products` (the live menu from the store) so edited prices are used.
 */
export function buildOrderItem(
  productId: string,
  choiceIds: string[],
  quantity = 1,
  extra: { note?: string; groupId?: string; products?: Product[] } = {},
): OrderItem {
  const product = getProduct(productId, extra.products);
  if (!product) throw new Error(`Unknown product: ${productId}`);

  const options: SelectedOption[] = [];
  for (const group of product.optionGroups) {
    for (const choice of group.choices) {
      if (choiceIds.includes(choice.id)) {
        options.push({
          groupId: group.id,
          groupLabel: group.label,
          choiceId: choice.id,
          choiceLabel: choice.label,
          priceDelta: choice.priceDelta,
        });
      }
    }
  }

  return {
    lineId: makeId("line"),
    productId,
    productName: product.name,
    emoji: product.emoji,
    unitPrice: calcUnitPrice(product.basePrice, options),
    quantity,
    options,
    note: extra.note,
    groupId: extra.groupId,
  };
}

// ── Group orders ─────────────────────────────────────────────────────────────

/**
 * Splits an order's items into sections per person.
 * Orders without groups come back as one unlabeled section.
 */
export function itemsByGroup(order: { groups?: OrderGroup[]; items: OrderItem[] }): { label: string | null; items: OrderItem[] }[] {
  if (!order.groups || order.groups.length < 2) return [{ label: null, items: order.items }];
  return order.groups
    .map((g) => ({ label: g.label, items: order.items.filter((i) => i.groupId === g.id) }))
    .filter((section) => section.items.length > 0);
}

// ── Dates ────────────────────────────────────────────────────────────────────

/** Orders that count as "today" for dashboards */
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Required option groups this line hasn't chosen yet (e.g. ["Choose dip"]) */
export function missingRequiredOptions(item: OrderItem, products: Product[] = PRODUCTS): string[] {
  const product = getProduct(item.productId, products);
  if (!product) return [];
  return product.optionGroups
    .filter((g) => g.required && !item.options.some((o) => o.groupId === g.id))
    .map((g) => g.label);
}
