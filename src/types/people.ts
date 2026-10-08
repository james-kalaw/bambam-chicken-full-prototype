// Customers, staff, roles and branches.

export type StaffRole = "owner" | "co_owner" | "manager" | "cashier" | "kitchen";

export type CustomerSegment =
  | "new"
  | "returning"
  | "frequent"
  | "high_value"
  | "inactive";

export interface Customer {
  /** Unique customer ID, e.g. CUS-000428 */
  id: string;
  name: string;
  mobile: string;
  /** Orders placed through the app/website */
  onlineOrders: number;
  /** In-store orders where the cashier linked this customer */
  walkInOrders: number;
  lifetimeSpend: number;
  /** productId → units bought; used to work out the favorite product */
  productCounts?: Record<string, number>;
  favoriteProduct?: string;
  favoriteFlavor?: string;
  /** Loyalty is a future feature; earning rules are not decided yet */
  loyaltyPoints?: number;
  segment: CustomerSegment;
  joinedAt: string;
  lastOrderAt?: string;
}

export interface CustomerSession {
  customerId: string;
  name: string;
  mobile: string;
  trustedDevice: boolean;
}

export type EmployeeStatus = "active" | "inactive" | "on_leave";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  branchId: string;
  status: EmployeeStatus;
  lastLogin: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  status: "active" | "planned";
}

export interface AuditLog {
  id: string;
  user: string;
  role: StaffRole;
  action: string;
  module: string;
  branchId: string;
  details?: string;
  createdAt: string;
}
