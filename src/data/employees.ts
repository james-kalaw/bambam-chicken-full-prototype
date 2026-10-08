import type { AuditLog, Branch, Employee } from "@/types/people";

// DEMO STAFF & BRANCHES — fictional. Owner and Co-owner have SEPARATE accounts.

export const BRANCHES: Branch[] = [
  { id: "tip-qc", name: "Bambam TIP QC", location: "Near the university, Quezon City", status: "active" },
  { id: "branch-2", name: "Bambam Branch 2", location: "Location to be decided", status: "planned" },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export function createEmployees(): Employee[] {
  return [
    { id: "emp-owner", name: "Marco Reyes", email: "marco@bambam.demo", role: "owner", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(0.2) },
    { id: "emp-coowner", name: "Bea Santos", email: "bea@bambam.demo", role: "co_owner", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(5) },
    { id: "emp-manager", name: "Carla Mendoza", email: "carla@bambam.demo", role: "manager", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(1) },
    { id: "emp-cashier", name: "Jun Ramos", email: "jun@bambam.demo", role: "cashier", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(2) },
    { id: "emp-cashier-2", name: "Kim Aquino", email: "kim@bambam.demo", role: "cashier", branchId: "tip-qc", status: "inactive", lastLogin: hoursAgo(50) },
    { id: "emp-kitchen", name: "Paolo Garcia", email: "paolo@bambam.demo", role: "kitchen", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(3) },
    { id: "emp-kitchen-2", name: "Liza Torres", email: "liza@bambam.demo", role: "kitchen", branchId: "tip-qc", status: "active", lastLogin: hoursAgo(3.5) },
    { id: "emp-kitchen-3", name: "Ken Navarro", email: "ken@bambam.demo", role: "kitchen", branchId: "tip-qc", status: "on_leave", lastLogin: hoursAgo(120) },
  ];
}

/** Which demo account the role switcher signs in as */
export const DEMO_ACCOUNT_IDS = ["emp-owner", "emp-coowner", "emp-manager", "emp-cashier", "emp-kitchen"];

export function createAuditLogs(): AuditLog[] {
  return [
    { id: "log-1", user: "Marco Reyes", role: "owner", action: "Changed product price", module: "Products", branchId: "tip-qc", details: "Chicken Chops ₱110 → ₱115", createdAt: hoursAgo(26) },
    { id: "log-2", user: "Carla Mendoza", role: "manager", action: "Adjusted inventory", module: "Inventory", branchId: "tip-qc", details: "Chicken (boneless) 12 kg → 18 kg (Stock In)", createdAt: hoursAgo(4.3) },
    { id: "log-3", user: "Jun Ramos", role: "cashier", action: "Refunded order", module: "Orders", branchId: "tip-qc", details: "Order T-031 refunded (wrong item)", createdAt: hoursAgo(3) },
    { id: "log-4", user: "Marco Reyes", role: "owner", action: "Changed employee role", module: "Employees", branchId: "tip-qc", details: "Kim Aquino: Kitchen Staff → Cashier", createdAt: hoursAgo(28) },
    { id: "log-5", user: "Bea Santos", role: "co_owner", action: "Granted temporary production access", module: "Security", branchId: "tip-qc", details: "Developer access for 2 hours (bug fix) — auto-expired", createdAt: hoursAgo(72) },
    { id: "log-6", user: "Marco Reyes", role: "owner", action: "Signed in", module: "Security", branchId: "tip-qc", details: "Password + OTP verified", createdAt: hoursAgo(0.2) },
  ];
}
