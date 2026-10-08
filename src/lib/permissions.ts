import { DEMO_CONFIG } from "@/data/demo-config";
import type { StaffRole } from "@/types/people";

// Role-based access for the ADMIN side.
// IMPORTANT: in the real system these rules must also be enforced by the
// FastAPI backend. Hiding a menu item in the UI is not security by itself.

export type AdminModule =
  | "dashboard"
  | "pos"
  | "orders"
  | "cash"
  | "kitchen"
  | "inventory"
  | "products"
  | "customers"
  | "analytics"
  | "employees"
  | "branches"
  | "ai"
  | "audit-logs"
  | "settings";

const ALL_MODULES: AdminModule[] = [
  "dashboard", "pos", "orders", "cash", "kitchen", "inventory", "products", "customers",
  "analytics", "employees", "branches", "ai", "audit-logs", "settings",
];

const ROLE_MODULES: Record<StaffRole, AdminModule[]> = {
  owner: ALL_MODULES,
  co_owner: ALL_MODULES,
  manager: [
    "dashboard", "pos", "orders", "cash", "kitchen", "inventory", "products", "customers",
    "employees", "ai",
    ...(DEMO_CONFIG.managerCanViewFinancials ? (["analytics"] as AdminModule[]) : []),
  ],
  cashier: ["pos", "orders", "cash", "kitchen", "ai"],
  kitchen: ["kitchen", "ai"],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  co_owner: "Co-owner",
  manager: "Branch Manager",
  cashier: "Cashier",
  kitchen: "Kitchen Staff",
};

export function canAccess(role: StaffRole, module: AdminModule): boolean {
  return ROLE_MODULES[role].includes(module);
}

/** Revenue, profit, customer spending and supplier prices */
export function canViewFinancials(role: StaffRole): boolean {
  if (role === "owner" || role === "co_owner") return true;
  if (role === "manager") return DEMO_CONFIG.managerCanViewFinancials;
  return false;
}

/** Accept/decline online orders and change payment status */
export function canManageOrders(role: StaffRole): boolean {
  return role !== "kitchen";
}

/** Change prices, availability, employee roles */
export function canEditBusinessData(role: StaffRole): boolean {
  return role === "owner" || role === "co_owner" || role === "manager";
}

/** Add stock, record waste, adjust counts, set thresholds (Owner + authorized Manager) */
export function canManageInventory(role: StaffRole): boolean {
  return role === "owner" || role === "co_owner" || role === "manager";
}

/** Verify GCash/Maya proofs, collect cash, refund. The kitchen never handles payments. */
export function canHandlePayments(role: StaffRole): boolean {
  return role !== "kitchen";
}

/** Customer purchase history and spending (not needed by cashiers or kitchen) */
export function canViewCustomerHistory(role: StaffRole): boolean {
  return role === "owner" || role === "co_owner" || role === "manager";
}

/** First page a role lands on after signing in */
export function homeModuleFor(role: StaffRole): AdminModule {
  if (role === "kitchen") return "kitchen";
  if (role === "cashier") return "pos";
  return "dashboard";
}
