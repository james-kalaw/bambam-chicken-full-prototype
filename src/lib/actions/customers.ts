// CUSTOMER actions (future FastAPI modules: "auth" + "customers").
// Only KNOWN customers have records. Guest walk-ins never create one.

import type { DemoState } from "@/lib/demo-state";
import { getProduct } from "@/lib/order-utils";
import type { Order } from "@/types/order";
import type { Customer } from "@/types/people";
import type { WithResult } from "./helpers";

export function findCustomerByMobile(s: DemoState, mobile: string): Customer | undefined {
  const digits = mobile.replace(/\D/g, "");
  return s.customers.find((c) => c.mobile === digits);
}

/** Simulated OTP sign-in: finds the customer by mobile number, or creates a new account */
export function signInCustomer(s: DemoState, mobile: string, name: string | undefined, trustedDevice: boolean): WithResult<Customer> {
  const digits = mobile.replace(/\D/g, "");
  let customer = findCustomerByMobile(s, digits);
  let customers = s.customers;
  if (!customer) {
    const highest = Math.max(...s.customers.map((c) => Number(c.id.replace("CUS-", ""))));
    customer = {
      id: `CUS-${String(highest + 1).padStart(6, "0")}`,
      name: name?.trim() || "Bambam Customer",
      mobile: digits,
      onlineOrders: 0,
      walkInOrders: 0,
      lifetimeSpend: 0,
      segment: "new",
      joinedAt: new Date().toISOString(),
    };
    customers = [customer, ...s.customers];
  }
  return {
    state: { ...s, customers, customerSession: { customerId: customer.id, name: customer.name, mobile: digits, trustedDevice } },
    value: customer,
  };
}

export function signOutCustomer(s: DemoState): DemoState {
  return { ...s, customerSession: null };
}

/**
 * When a known customer's order is completed (online OR linked walk-in),
 * update their history: order count, lifetime spend and favorite product.
 * Loyalty points are NOT calculated — the earning rules aren't decided yet.
 */
export function recordCustomerPurchase(s: DemoState, order: Order): DemoState {
  if (!order.customerId) return s; // guest → nothing to update
  return {
    ...s,
    customers: s.customers.map((c) => {
      if (c.id !== order.customerId) return c;
      const productCounts = { ...(c.productCounts ?? {}) };
      for (const item of order.items) productCounts[item.productId] = (productCounts[item.productId] ?? 0) + item.quantity;
      const [favoriteId] = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0] ?? [];
      return {
        ...c,
        onlineOrders: c.onlineOrders + (order.channel === "online" ? 1 : 0),
        walkInOrders: c.walkInOrders + (order.channel === "walk_in" ? 1 : 0),
        lifetimeSpend: c.lifetimeSpend + order.total,
        productCounts,
        favoriteProduct: getProduct(favoriteId ?? "", s.products)?.name ?? c.favoriteProduct,
        lastOrderAt: order.completedAt ?? new Date().toISOString(),
      };
    }),
  };
}
