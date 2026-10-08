// ─────────────────────────────────────────────────────────────────────────────
// DEMO STATE
// The shape of all prototype data, plus the starting (seed) values.
// In the real system each list here becomes a PostgreSQL table behind FastAPI.
// ─────────────────────────────────────────────────────────────────────────────

import { createCashDrawer } from "@/data/cash";
import { createCustomers } from "@/data/customers";
import { createAuditLogs, createEmployees } from "@/data/employees";
import { createInventory, createInventoryLog } from "@/data/inventory";
import { createNotifications } from "@/data/notifications";
import { createSeedOrders, INITIAL_ORDER_SEQUENCE, INITIAL_QUEUE_COUNTERS } from "@/data/orders";
import { PRODUCTS } from "@/data/products";
import type { CashDrawer } from "@/types/cash";
import type { InventoryItem, InventoryTransaction } from "@/types/inventory";
import type { AppNotification } from "@/types/notification";
import type { CartItem, Order, OrderType } from "@/types/order";
import type { AuditLog, Customer, CustomerSession, Employee } from "@/types/people";
import type { Product } from "@/types/product";

/** Bump the version whenever the shape changes, so old saved demos are ignored */
export const STORAGE_KEY = "bambam-demo-state-v2";

export interface DemoState {
  orders: Order[];
  /** Last queue number used per order type (D-052, T-052…) */
  queueCounters: Record<OrderType, number>;
  /** Next internal order/payment number (ORD-…-00152) */
  orderSequence: number;
  products: Product[];
  inventory: InventoryItem[];
  inventoryLog: InventoryTransaction[];
  customers: Customer[];
  employees: Employee[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  cashDrawer: CashDrawer;
  cart: CartItem[];
  customerSession: CustomerSession | null;
  /** Employee currently signed in to the admin side */
  adminUserId: string | null;
  onlineOrderingOpen: boolean;
  /** "all" or a branch id */
  selectedBranch: string;
  /** Pitch helper: makes the next online order fail so the error state can be shown */
  simulateSubmitError: boolean;
}

export function createInitialState(): DemoState {
  const orders = createSeedOrders();
  return {
    orders,
    queueCounters: { ...INITIAL_QUEUE_COUNTERS },
    orderSequence: INITIAL_ORDER_SEQUENCE,
    products: structuredClone(PRODUCTS),
    inventory: createInventory(),
    inventoryLog: createInventoryLog(),
    customers: createCustomers(),
    employees: createEmployees(),
    notifications: createNotifications(orders),
    auditLogs: createAuditLogs(),
    cashDrawer: createCashDrawer(orders),
    cart: [],
    customerSession: null,
    adminUserId: null,
    onlineOrderingOpen: true,
    selectedBranch: "tip-qc",
    simulateSubmitError: false,
  };
}
