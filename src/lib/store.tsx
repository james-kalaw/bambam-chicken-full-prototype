"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO STORE (React side)
// - Holds the DemoState in React state (see lib/demo-state.ts for its shape).
// - Saves it to localStorage so a refresh doesn't lose the demo.
// - Syncs between browser tabs, so the Customer app in one window and the
//   Owner/Kitchen screens in another update each other live.
//
// The business logic lives in lib/actions/*. Each action is a plain function
// (state, input) → new state. Later, each one becomes a call to the FastAPI
// backend, and this file is the only place that needs to change.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { MascotLoading } from "@/components/shared/mascot-loading";
import * as adminActions from "@/lib/actions/admin";
import * as cashActions from "@/lib/actions/cash";
import * as customerActions from "@/lib/actions/customers";
import * as inventoryActions from "@/lib/actions/inventory";
import * as orderActions from "@/lib/actions/orders";
import * as paymentActions from "@/lib/actions/payments";
import { createInitialState, STORAGE_KEY, type DemoState } from "@/lib/demo-state";
import type { CartItem, Order } from "@/types/order";
import type { Customer, Employee, StaffRole } from "@/types/people";
import type { ProductAvailability } from "@/types/product";

export type { DemoState } from "@/lib/demo-state";
export type { PlaceOrderInput, PlaceOrderResult, WalkInOrderInput } from "@/lib/actions/orders";
export type { CollectPaymentInput } from "@/lib/actions/payments";
export type { StockOutReason } from "@/lib/actions/inventory";

interface DemoActions {
  // Cart
  addToCart: (item: CartItem) => void;
  updateCartItem: (lineId: string, item: CartItem) => void;
  setCartQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  // Customer account (simulated OTP)
  signInCustomer: (mobile: string, name: string | undefined, trustedDevice: boolean) => Customer;
  findCustomerByMobile: (mobile: string) => Customer | undefined;
  signOutCustomer: () => void;
  // Orders
  placeOnlineOrder: (input: orderActions.PlaceOrderInput) => orderActions.PlaceOrderResult;
  createWalkInOrder: (input: orderActions.WalkInOrderInput) => Order;
  acceptOrder: (orderId: string) => void;
  declineOrder: (orderId: string, reason: string) => void;
  startPreparing: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  // Payments
  submitPaymentProof: (orderId: string, proof: { proofImageUrl: string; providerReference?: string; submittedAmount: number }) => void;
  verifyPayment: (orderId: string) => void;
  markPaymentIssue: (orderId: string, note: string) => void;
  collectPayment: (orderId: string, input: paymentActions.CollectPaymentInput) => void;
  refundPayment: (orderId: string) => void;
  // Cash drawer
  recordCashExpense: (amount: number, note: string) => void;
  openCashDrawer: (openingCash: number) => void;
  closeCashDrawer: (countedCash: number) => void;
  // Inventory
  recordStockIn: (itemId: string, quantity: number, extras: { purchaseCost?: number; supplier?: string; receivedDate?: string; note?: string }) => void;
  adjustToCount: (itemId: string, countedQuantity: number, reason: string) => void;
  recordStockOut: (itemId: string, reason: inventoryActions.StockOutReason, quantity: number, note?: string) => void;
  setLowStockThreshold: (itemId: string, threshold: number) => void;
  // Products, staff, settings
  setProductAvailability: (productId: string, availability: ProductAvailability) => void;
  setProductPrice: (productId: string, price: number) => void;
  changeEmployeeRole: (employeeId: string, role: StaffRole) => void;
  setOnlineOrdering: (open: boolean) => void;
  setSelectedBranch: (branchId: string) => void;
  setSimulateSubmitError: (on: boolean) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
  // Admin session
  signInAdmin: (employeeId: string) => void;
  signOutAdmin: () => void;
  // Demo
  resetDemo: () => void;
}

type DemoStore = DemoState & DemoActions;

const DemoStoreContext = createContext<DemoStore | null>(null);

function loadSaved(raw: string): DemoState {
  return { ...createInitialState(), ...(JSON.parse(raw) as Partial<DemoState>) };
}

/**
 * A tiny "external store": the current state plus a list of listeners.
 * React reads it with useSyncExternalStore, and actions can always read the
 * LATEST state with api.get() — even several actions in a row.
 */
function createStoreApi() {
  let state = createInitialState();
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: DemoState) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type StoreApi = ReturnType<typeof createStoreApi>;

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [api] = useState(createStoreApi);
  const state = useSyncExternalStore(api.subscribe, api.get, api.get);
  const [hydrated, setHydrated] = useState(false);

  // Load saved demo state once, after the first render in the browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) api.set(loadSaved(saved));
    } catch {
      // Corrupt or blocked storage: keep the fresh demo state
    }
    // localStorage only exists in the browser, so it must be read after mount
    // (reading it during render would make server and client HTML differ).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, [api]);

  // Save every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — the demo still works in memory
    }
  }, [state, hydrated]);

  // Pick up changes made in other tabs (e.g. customer tab → owner tab).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      try {
        api.set(e.newValue === null ? createInitialState() : loadSaved(e.newValue));
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [api]);

  const actions = useMemo(() => bindActions(api), [api]);
  const value = useMemo<DemoStore>(() => ({ ...state, ...actions }), [state, actions]);

  return (
    <DemoStoreContext.Provider value={value}>
      {/* Wait for saved state before rendering, so pages never flash the wrong data */}
      {hydrated ? children : <MascotLoading />}
    </DemoStoreContext.Provider>
  );
}

/** Connects every plain action function (lib/actions/*) to the store */
function bindActions(api: StoreApi): DemoActions {
  const commit = api.set;
  const get = api.get;
  /** Runs an action against the latest state and saves the result */
  const run = <A extends unknown[]>(fn: (s: DemoState, ...args: A) => DemoState) => (...args: A) => commit(fn(get(), ...args));

  return {
    addToCart: run(adminActions.addToCart),
    updateCartItem: run(adminActions.updateCartItem),
    setCartQuantity: run(adminActions.setCartQuantity),
    removeFromCart: run(adminActions.removeFromCart),
    clearCart: run(adminActions.clearCart),

    signInCustomer: (mobile, name, trusted) => {
      const { state: next, value } = customerActions.signInCustomer(get(), mobile, name, trusted);
      commit(next);
      return value;
    },
    findCustomerByMobile: (mobile) => customerActions.findCustomerByMobile(get(), mobile),
    signOutCustomer: run(customerActions.signOutCustomer),

    placeOnlineOrder: (input) => {
      const { state: next, value } = orderActions.placeOnlineOrder(get(), input);
      commit(next);
      return value;
    },
    createWalkInOrder: (input) => {
      const { state: next, value } = orderActions.createWalkInOrder(get(), input);
      commit(next);
      return value;
    },
    acceptOrder: run(orderActions.acceptOrder),
    declineOrder: run(orderActions.declineOrder),
    startPreparing: run(orderActions.startPreparing),
    completeOrder: run(orderActions.completeOrder),

    submitPaymentProof: run(paymentActions.submitPaymentProof),
    verifyPayment: run(paymentActions.verifyPayment),
    markPaymentIssue: run(paymentActions.markPaymentIssue),
    collectPayment: run(paymentActions.collectPayment),
    refundPayment: run(paymentActions.refundPayment),

    recordCashExpense: run(cashActions.recordCashExpense),
    openCashDrawer: run(cashActions.openCashDrawer),
    closeCashDrawer: run(cashActions.closeCashDrawer),

    recordStockIn: run(inventoryActions.recordStockIn),
    adjustToCount: run(inventoryActions.adjustToCount),
    recordStockOut: run(inventoryActions.recordStockOut),
    setLowStockThreshold: run(inventoryActions.setLowStockThreshold),

    setProductAvailability: run(adminActions.setProductAvailability),
    setProductPrice: run(adminActions.setProductPrice),
    changeEmployeeRole: run(adminActions.changeEmployeeRole),
    setOnlineOrdering: run(adminActions.setOnlineOrdering),
    setSelectedBranch: run(adminActions.setSelectedBranch),
    setSimulateSubmitError: run(adminActions.setSimulateSubmitError),

    markNotificationRead: run(adminActions.markNotificationRead),
    markAllRead: run(adminActions.markAllRead),

    signInAdmin: run(adminActions.signInAdmin),
    signOutAdmin: run(adminActions.signOutAdmin),
    resetDemo: run(adminActions.resetDemo),
  };
}

export function useDemoStore(): DemoStore {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error("useDemoStore must be used inside <DemoStoreProvider>");
  return ctx;
}

/** The employee signed in on the admin side (or null) */
export function useCurrentEmployee(): Employee | null {
  const { employees, adminUserId } = useDemoStore();
  return employees.find((e) => e.id === adminUserId) ?? null;
}
