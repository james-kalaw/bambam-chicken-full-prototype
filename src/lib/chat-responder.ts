// SIMULATED chatbot "Bambam". No AI API is called — questions are matched by
// keywords and answered from the demo data. Later this becomes a FastAPI
// endpoint that calls an AI model, with the SAME role restrictions enforced
// on the server.
//
// Role rules (also applied here in the prototype):
// - Kitchen: queue/order status and ingredients only. Never revenue, profit,
//   customer spending, salaries or employee administration.
// - Cashier: POS help, payments, order lookup. No owner-only profitability or
//   customer purchase history.
// - Owner/Co-owner: everything in the demo data.
// - Bambam never performs sensitive actions (refunds, price/role changes…).

import { HOURLY_ORDERS, LAST_7_DAYS_REVENUE, MONTH_COMPARISON } from "@/data/analytics";
import { getTodayStats } from "@/lib/analytics";
import type { DemoState } from "@/lib/demo-state";
import { peso, qty } from "@/lib/format";
import { getStockStatus, STOCK_STATUS_LABELS } from "@/lib/inventory-utils";
import { CHANNEL_LABELS, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, optionsSummary, PAYMENT_STATUS_LABELS, paymentMethodText } from "@/lib/order-utils";
import { canHandlePayments, canViewCustomerHistory, canViewFinancials, ROLE_LABELS } from "@/lib/permissions";
import type { StaffRole } from "@/types/people";

export interface ChatAnswer {
  text: string;
  bullets?: string[];
  link?: { href: string; label: string };
}

export const CUSTOMER_PROMPTS = [
  "What can I order under ₱200?",
  "Recommend me something.",
  "Where is my order?",
  "Which drink is non-coffee?",
  "What did I order last time?",
];

const STAFF_PROMPTS: Record<StaffRole, string[]> = {
  owner: ["How were sales today?", "What's running low?", "What is our best seller?", "What time was busiest?", "Compare this week with last week."],
  co_owner: ["How were sales today?", "What's running low?", "What is our best seller?", "What time was busiest?", "Compare this week with last week."],
  manager: ["What's running low?", "Which payments need verification?", "What's in the kitchen queue?", "How were sales today?"],
  cashier: ["Which payments need verification?", "How do I verify a GCash payment?", "Find order P-027", "How do group orders work?", "How much profit today?"],
  kitchen: ["What's in the queue?", "How does the kitchen queue work?", "What's running low?", "How much revenue today?"],
};

export function staffPrompts(role: StaffRole): string[] {
  return STAFF_PROMPTS[role];
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export function customerReply(question: string, state: DemoState): ChatAnswer {
  const q = question.toLowerCase();
  const available = state.products.filter((p) => p.availability === "available");
  const myOrders = state.orders.filter((o) => o.customerId === state.customerSession?.customerId);

  if (has(q, "under", "budget", "cheap", "₱")) {
    const amount = Number(q.match(/\d+/)?.[0] ?? 200);
    const picks = available.filter((p) => p.category === "chicken" && p.basePrice + 20 <= amount).slice(0, 4);
    return {
      text: `You can try these rice meals under ${peso(amount)}:`,
      bullets: picks.map((p) => `${p.name} Rice Meal — ${peso(p.basePrice + 20)}`),
      link: { href: "/customer/menu?category=chicken", label: "Open Chicken Meals" },
    };
  }
  if (has(q, "where", "status", "track", "my order")) {
    const active = myOrders.find((o) => ["pending_confirmation", "confirmed", "preparing"].includes(o.orderStatus));
    if (!state.customerSession) return { text: "Sign in first so I can look up your orders.", link: { href: "/auth/customer", label: "Sign in" } };
    if (!active) return { text: "You don't have an order in progress right now. Hungry? 😄", link: { href: "/customer/menu", label: "Browse the menu" } };
    return {
      text: `Your order ${active.queueNumber} is: ${ORDER_STATUS_LABELS[active.orderStatus]}.`,
      link: { href: `/customer/orders/${active.id}`, label: `Track ${active.queueNumber}` },
    };
  }
  if (has(q, "non-coffee", "no coffee", "without coffee", "non coffee", "not coffee")) {
    const drinks = available.filter((p) => p.category === "drinks");
    return {
      text: "Here are our non-coffee drinks available right now:",
      bullets: drinks.map((d) => `${d.name} — from ${peso(d.basePrice)}`),
      link: { href: "/customer/menu?category=drinks", label: "See drinks" },
    };
  }
  if (has(q, "last time", "previous", "last order", "ordered before")) {
    const last = myOrders.find((o) => o.orderStatus === "completed");
    if (!last) return { text: "I couldn't find a completed order on your account yet." };
    return {
      text: `Your last completed order was ${last.queueNumber}:`,
      bullets: last.items.map((i) => `${i.quantity} × ${i.productName}${i.options.length ? ` (${optionsSummary(i.options)})` : ""}`),
      link: { href: "/customer/orders", label: "Reorder from history" },
    };
  }
  if (has(q, "recommend", "suggest", "what should", "hungry", "best")) {
    return {
      text: "Students love this combo:",
      bullets: [
        "Chicken Chops Rice Meal in Creamy Garlic Parmesan with Garlic Mayo",
        "Iced Bam Brew Latte with Coffee Jelly",
        "Not into coffee? Try the Iced Matcha Latte",
      ],
      link: { href: "/customer/menu", label: "Start ordering" },
    };
  }
  if (has(q, "open", "hours", "paused")) {
    return { text: state.onlineOrderingOpen ? "We're open and accepting online orders! 🍗" : "Online orders are temporarily paused because we're very busy. Please check back soon." };
  }
  return {
    text: "I'm still learning! I can help with menu questions, recommendations, your order status, and your past orders.",
    bullets: CUSTOMER_PROMPTS.slice(0, 3),
  };
}

/** Finds "P-027", "p027", "D 51"… in a question */
function findOrderInQuestion(q: string, state: DemoState) {
  const m = /\b(dl|d|t|p)\s*-?\s*(\d{1,3})\b/i.exec(q);
  if (!m) return undefined;
  const queue = `${m[1].toUpperCase()}-${m[2].padStart(3, "0")}`;
  return state.orders.find((o) => o.queueNumber === queue) ?? null;
}

export function staffReply(question: string, state: DemoState, role: StaffRole): ChatAnswer {
  const q = question.toLowerCase();
  const roleName = ROLE_LABELS[role];

  // ── Restricted topics first ──
  if (has(q, "salary", "salaries", "payroll", "wage")) {
    if (role !== "owner" && role !== "co_owner") return { text: `Sorry, salary information isn't available for the ${roleName} role.` };
    return { text: "Salary data isn't part of this prototype yet — it will only be visible to owners once it's added." };
  }
  if (has(q, "sales", "revenue", "profit", "money", "earn", "compare", "income", "how were", "best seller", "best-seller", "busiest") && !canViewFinancials(role)) {
    return {
      text: `Sorry, the ${roleName} role doesn't have access to sales or financial information. I can help with the order queue${canHandlePayments(role) ? ", payments" : ""} and ingredients instead.`,
    };
  }
  if (has(q, "customer history", "spent", "spending", "lifetime", "cus-") && !canViewCustomerHistory(role)) {
    return { text: `Sorry, customer purchase history isn't available for the ${roleName} role.` };
  }
  // Sensitive actions are never performed silently by the assistant.
  if (has(q, "refund", "delete", "change price", "change role", "export", "remove employee", "mark paid", "mark as paid", "verify payment for", "add stock")) {
    return {
      text: "I can't do that for you. Refunds, payment verification, stock changes, price/role changes and data exports must be done in the normal screens with confirmation, so they're recorded in the audit log.",
      link: { href: role === "kitchen" ? "/admin/kitchen" : "/admin/orders", label: role === "kitchen" ? "Go to Kitchen" : "Go to Orders" },
    };
  }

  const today = getTodayStats(state.orders);

  // ── Order lookup: "Find order P-027" ──
  const found = findOrderInQuestion(q, state);
  if (found === null) return { text: "I couldn't find that order number." };
  if (found) {
    const bullets = [
      `${CHANNEL_LABELS[found.channel]} · ${ORDER_TYPE_LABELS[found.orderType]}${found.scheduledTime ? ` · ${found.scheduledTime}` : ""}`,
      ...found.items.map((i) => `${i.quantity} × ${i.productName}${i.options.length ? ` (${optionsSummary(i.options)})` : ""}`),
    ];
    if (role !== "kitchen") bullets.push(`Payment: ${PAYMENT_STATUS_LABELS[found.payment.status]} · ${paymentMethodText(found)}`);
    return {
      text: `${found.queueNumber} is ${ORDER_STATUS_LABELS[found.orderStatus].toLowerCase()}.`,
      bullets,
      link: role === "kitchen" ? { href: "/admin/kitchen", label: "Open kitchen" } : { href: `/admin/orders?open=${found.id}`, label: `Open ${found.queueNumber}` },
    };
  }

  // ── Payments ──
  if (has(q, "how do i verify", "how to verify", "verify a gcash", "verify gcash")) {
    if (!canHandlePayments(role)) return { text: "Payments are handled by the cashier or owner, not the kitchen." };
    return {
      text: "To verify an online GCash/Maya payment:",
      bullets: [
        "Orders → “Payments to verify” tab",
        "Tap “View proof” and check the amount, recipient and reference number",
        "Tap “Verify payment” if it matches, or “Payment issue” if not",
        "Walk-in customers don't upload anything — check their success screen and tap “Mark payment verified” in the POS",
      ],
      link: { href: "/admin/orders", label: "Open Orders" },
    };
  }
  if (has(q, "payment", "verification", "verify", "unpaid")) {
    if (!canHandlePayments(role)) return { text: "Payments are handled by the cashier or owner, not the kitchen." };
    const toVerify = state.orders.filter((o) => o.payment.status === "pending_verification");
    const unpaid = state.orders.filter((o) => o.payment.status === "unpaid" && o.orderStatus !== "declined" && o.orderStatus !== "pending_confirmation");
    return {
      text: toVerify.length ? `${toVerify.length} payment${toVerify.length === 1 ? "" : "s"} need verification:` : "No payments are waiting for verification right now.",
      bullets: [
        ...toVerify.map((o) => `${o.queueNumber} · ${paymentMethodText(o)} · ${peso(o.total)}`),
        ...(unpaid.length ? [`Still unpaid (e.g. cash at pickup): ${unpaid.map((o) => o.queueNumber).join(", ")}`] : []),
      ],
      link: { href: "/admin/orders", label: "Open Orders" },
    };
  }

  // ── POS help ──
  if (has(q, "group order", "group orders", "people", "split")) {
    return {
      text: "Group orders keep one Order ID for several people:",
      bullets: [
        "In the POS, tap “Group order: add person” (or “Add Person”)",
        "Select a person, then tap products — they're added to that person",
        "Use “Duplicate” when someone says “same, but soy garlic”, then change only the flavor",
        "The kitchen sees the items grouped by person",
      ],
      link: role === "kitchen" ? undefined : { href: "/admin/pos", label: "Open POS" },
    };
  }
  if (has(q, "link customer", "linking", "guest")) {
    return {
      text: "Walk-ins are Guests by default — no account needed. To add the purchase to a known customer, tap “Link Customer” in the POS and search their mobile number or scan their QR (simulated).",
    };
  }

  // ── Kitchen queue ──
  if (has(q, "how does the kitchen", "how does the queue", "queue work", "explain")) {
    return {
      text: "The kitchen has one queue for every order type:",
      bullets: [
        "Online orders appear only after the owner/cashier accepts them",
        "Walk-in POS orders appear right away",
        "Statuses: Confirmed → Preparing → Completed (there's no Ready step)",
        "Orders are shown in the order they were confirmed — priority rules are still to be decided by the owners",
      ],
    };
  }
  if (has(q, "queue", "kitchen", "preparing", "in progress")) {
    const confirmed = state.orders.filter((o) => o.orderStatus === "confirmed");
    const preparing = state.orders.filter((o) => o.orderStatus === "preparing");
    return {
      text: `${confirmed.length} order${confirmed.length === 1 ? "" : "s"} waiting to start, ${preparing.length} preparing.`,
      bullets: [
        ...(preparing.length ? [`Preparing: ${preparing.map((o) => o.queueNumber).join(", ")}`] : []),
        ...(confirmed.length ? [`To start: ${confirmed.map((o) => o.queueNumber).join(", ")}`] : []),
        ...(role !== "kitchen" && today.pending ? [`${today.pending} online order(s) still waiting for acceptance`] : []),
      ],
      link: { href: "/admin/kitchen", label: "Open kitchen" },
    };
  }

  // ── Ingredients (operational, allowed for all staff) ──
  if (has(q, "low", "running", "stock", "inventory", "ingredient")) {
    const low = state.inventory.filter((i) => getStockStatus(i) !== "healthy");
    if (low.length === 0) return { text: "All ingredients are above their configured stock thresholds. 👍" };
    return {
      text: `${low.length} ingredients are below their configured stock thresholds:`,
      bullets: low.map((i) => `${i.name} — ${STOCK_STATUS_LABELS[getStockStatus(i)]} (${qty(i.quantity)} ${i.unit})`),
      link: role === "kitchen" || role === "cashier" ? undefined : { href: "/admin/inventory", label: "Open inventory" },
    };
  }

  // ── Owner analytics (role already checked above) ──
  if (has(q, "sales", "revenue", "today", "how were", "profit")) {
    return {
      text: `Today so far: ${peso(today.revenue)} revenue from ${today.orders} orders (average ${peso(today.aov)}).`,
      bullets: [
        `Cash ${peso(today.cashRevenue)} · Electronic ${peso(today.electronicRevenue)}`,
        `${today.online} online orders, ${today.walkIn} walk-in orders`,
        has(q, "profit") ? "True profit needs confirmed costs — the dashboard shows an estimate on demo data." : `${today.pending} online order(s) waiting for confirmation`,
      ],
      link: { href: "/admin/dashboard", label: "Open dashboard" },
    };
  }
  if (has(q, "best", "top", "popular", "sold the most")) {
    const top = today.topProducts.slice(0, 3);
    return { text: `${top[0]?.name ?? "Chicken Chops"} is today's best seller.`, bullets: top.map((p) => `${p.name} — ${p.units} sold`) };
  }
  if (has(q, "busiest", "peak", "time", "hour")) {
    const peak = HOURLY_ORDERS.reduce((a, b) => (b.orders > a.orders ? b : a));
    return { text: `The busiest hour today was ${peak.hour} with ${peak.orders} orders — right at the lunch break between classes.` };
  }
  if (has(q, "compare", "week", "month", "improve", "last")) {
    const thisWeek = LAST_7_DAYS_REVENUE.reduce((a, b) => a + b, 0);
    const lastWeek = 148_900; // demo value
    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    const sales = MONTH_COMPARISON[0];
    return {
      text: `This week: ${peso(thisWeek)} vs last week ${peso(lastWeek)} (${change >= 0 ? "+" : ""}${change.toFixed(1)}%).`,
      bullets: [
        `This month's sales are up ${(((sales.current - sales.previous) / sales.previous) * 100).toFixed(1)}% vs last month.`,
        "Chicken Chops remained the best-selling product.",
        "Inventory waste decreased.",
      ],
      link: { href: "/admin/analytics", label: "Open analytics" },
    };
  }

  return {
    text: `I'm the ${roleName} version of Bambam (demo). Try one of these:`,
    bullets: STAFF_PROMPTS[role].slice(0, 3),
  };
}
