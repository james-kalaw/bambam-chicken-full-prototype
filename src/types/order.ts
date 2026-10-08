import type { SelectedOption } from "./product";

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS & PAYMENTS
//
// Four different identifiers — don't mix them up:
//   order.id            ORD-20261008-00152   internal order ID (unique forever)
//   order.queueNumber   T-052                short number called out to customers
//   order.payment.id    PAY-20261008-00152   internal Bambam payment ID
//   order.customerId    CUS-000428           only when a known customer is linked
//
// Order status and payment status are separate on purpose.
// Example: an order can be "preparing" while payment is still "unpaid"
// because the customer will pay cash at pickup.
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "preparing"
  | "completed"
  | "declined";

export type PaymentStatus =
  | "unpaid"
  | "pending_verification"
  | "paid"
  | "payment_issue"
  | "refunded";

/** HOW the food is received */
export type OrderType = "dine_in" | "takeout" | "pickup" | "delivery";

/** WHERE the order came from: customer app/web, or the counter POS */
export type OrderChannel = "online" | "walk_in";

export type PaymentMethod =
  | "cash"
  | "gcash"
  | "maya"
  | "bank_transfer"
  | "other_online";

/** Online customers choose to pay now (send proof) or later (at pickup/counter) */
export type PaymentTiming = "pay_now" | "pay_later";

export type DeclineReason =
  | "Item unavailable"
  | "Unable to accommodate requested time"
  | "Store temporarily at capacity"
  | "Other";

export interface Payment {
  /** Internal Bambam payment ID, e.g. PAY-20261008-00152 */
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  timing: PaymentTiming;
  amountDue: number;
  /** Amount actually recorded as paid (always the order total, never the cash handed over) */
  amountPaid?: number;
  /** Cash only: what the customer handed over, and the change given back */
  cashReceived?: number;
  changeGiven?: number;
  /** Reference number from GCash/Maya/bank — created by the provider, NOT by Bambam */
  providerReference?: string;
  /** Amount the customer says they sent (online Pay Now) */
  submittedAmount?: number;
  /** Local preview of the uploaded screenshot (no real file storage yet) */
  proofImageUrl?: string;
  submittedAt?: string;
  paidAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  issueNote?: string;
}

export interface OrderItem {
  /** Unique per line so the same product with different options stays separate */
  lineId: string;
  productId: string;
  productName: string;
  emoji: string;
  /** Base price + selected option prices, for ONE unit */
  unitPrice: number;
  quantity: number;
  options: SelectedOption[];
  note?: string;
  /** Which person in a group order this item belongs to (see Order.groups) */
  groupId?: string;
}

/** A person inside a group order. Names are optional — "Person 1" is fine. */
export interface OrderGroup {
  id: string;
  label: string;
}

export interface DeliveryDetails {
  name: string;
  mobile: string;
  address: string;
  landmark?: string;
  instructions?: string;
}

export interface Order {
  /** Internal order ID, e.g. ORD-20261008-00152 */
  id: string;
  /** Customer-facing number, e.g. P-025, D-021, T-035, DL-006 */
  queueNumber: string;
  /** Only set for KNOWN customers. Guest walk-ins have no customer ID. */
  customerId?: string;
  customerName?: string;
  channel: OrderChannel;
  orderType: OrderType;
  /** Only for group orders (2+ people). All items still live in `items`. */
  groups?: OrderGroup[];
  items: OrderItem[];
  subtotal: number;
  fees: number;
  total: number;
  orderStatus: OrderStatus;
  payment: Payment;
  /** "ASAP" or a slot label such as "12:30 PM" (pickup only) */
  scheduledTime?: string;
  delivery?: DeliveryDetails;
  declineReason?: string;
  branchId: string;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  completedAt?: string;
}

/** Items in the cart have the same shape as order lines */
export type CartItem = OrderItem;
