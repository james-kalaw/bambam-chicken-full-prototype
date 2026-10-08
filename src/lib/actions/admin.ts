// Smaller actions: cart, products, employees, settings, notifications, staff sign-in.
// (Future FastAPI modules: "products", "employees", "settings", "notifications", "auth".)

import type { DemoState } from "@/lib/demo-state";
import { createInitialState } from "@/lib/demo-state";
import { peso } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import type { CartItem } from "@/types/order";
import type { StaffRole } from "@/types/people";
import type { ProductAvailability } from "@/types/product";
import { withAudit } from "./helpers";

// ── Cart ─────────────────────────────────────────────────────────────────────

export const addToCart = (s: DemoState, item: CartItem): DemoState => ({ ...s, cart: [...s.cart, item] });

export const updateCartItem = (s: DemoState, lineId: string, item: CartItem): DemoState => ({
  ...s,
  cart: s.cart.map((c) => (c.lineId === lineId ? item : c)),
});

export const setCartQuantity = (s: DemoState, lineId: string, quantity: number): DemoState => ({
  ...s,
  cart: s.cart.map((c) => (c.lineId === lineId ? { ...c, quantity: Math.max(1, quantity) } : c)),
});

export const removeFromCart = (s: DemoState, lineId: string): DemoState => ({ ...s, cart: s.cart.filter((c) => c.lineId !== lineId) });

export const clearCart = (s: DemoState): DemoState => ({ ...s, cart: [] });

// ── Products ─────────────────────────────────────────────────────────────────

export function setProductAvailability(s: DemoState, productId: string, availability: ProductAvailability): DemoState {
  const product = s.products.find((p) => p.id === productId);
  if (!product) return s;
  return withAudit(
    { ...s, products: s.products.map((p) => (p.id === productId ? { ...p, availability } : p)) },
    "Changed product availability",
    "Products",
    `${product.name}: ${product.availability} → ${availability}`,
  );
}

export function setProductPrice(s: DemoState, productId: string, price: number): DemoState {
  const product = s.products.find((p) => p.id === productId);
  if (!product || product.basePrice === price) return s;
  return withAudit(
    { ...s, products: s.products.map((p) => (p.id === productId ? { ...p, basePrice: price } : p)) },
    "Changed product price",
    "Products",
    `${product.name} ${peso(product.basePrice)} → ${peso(price)}`,
  );
}

// ── Employees & settings ─────────────────────────────────────────────────────

export function changeEmployeeRole(s: DemoState, employeeId: string, role: StaffRole): DemoState {
  const emp = s.employees.find((e) => e.id === employeeId);
  if (!emp || emp.role === role) return s;
  return withAudit(
    { ...s, employees: s.employees.map((e) => (e.id === employeeId ? { ...e, role } : e)) },
    "Changed employee role",
    "Employees",
    `${emp.name}: ${ROLE_LABELS[emp.role]} → ${ROLE_LABELS[role]}`,
  );
}

export function setOnlineOrdering(s: DemoState, open: boolean): DemoState {
  return withAudit({ ...s, onlineOrderingOpen: open }, open ? "Resumed online ordering" : "Paused online ordering", "Settings");
}

export const setSelectedBranch = (s: DemoState, branchId: string): DemoState => ({ ...s, selectedBranch: branchId });

export const setSimulateSubmitError = (s: DemoState, on: boolean): DemoState => ({ ...s, simulateSubmitError: on });

// ── Notifications ────────────────────────────────────────────────────────────

export const markNotificationRead = (s: DemoState, id: string): DemoState => ({
  ...s,
  notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
});

export function markAllRead(s: DemoState, ids: string[]): DemoState {
  const set = new Set(ids);
  return { ...s, notifications: s.notifications.map((n) => (set.has(n.id) ? { ...n, read: true } : n)) };
}

// ── Staff session ────────────────────────────────────────────────────────────

export function signInAdmin(s: DemoState, employeeId: string): DemoState {
  const emp = s.employees.find((e) => e.id === employeeId);
  if (!emp) return s;
  const next: DemoState = {
    ...s,
    adminUserId: employeeId,
    employees: s.employees.map((e) => (e.id === employeeId ? { ...e, lastLogin: new Date().toISOString() } : e)),
  };
  return withAudit(next, "Signed in", "Security", `${ROLE_LABELS[emp.role]} · Password + OTP verified (simulated)`);
}

export const signOutAdmin = (s: DemoState): DemoState => ({ ...s, adminUserId: null });

/** Back to the starting demo data, keeping whoever is signed in */
export function resetDemo(s: DemoState): DemoState {
  return { ...createInitialState(), adminUserId: s.adminUserId, customerSession: s.customerSession };
}
