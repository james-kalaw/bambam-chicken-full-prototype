import type { Customer } from "@/types/people";

// DEMO CUSTOMERS — fictional names and numbers.
// Only KNOWN customers live here. Guest walk-ins never create records.

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const DEMO_CUSTOMER_ID = "CUS-000428";

export function createCustomers(): Customer[] {
  return [
    {
      id: "CUS-000428", name: "Alex Dela Cruz", mobile: "09171234567",
      onlineOrders: 8, walkInOrders: 10, lifetimeSpend: 2_640,
      productCounts: { "chicken-chops": 11, latte: 6, "chicken-poppers": 3, "spanish-latte": 2 },
      favoriteProduct: "Chicken Chops", favoriteFlavor: "Creamy Garlic Parmesan", loyaltyPoints: 430,
      segment: "frequent", joinedAt: daysAgo(64), lastOrderAt: daysAgo(0),
    },
    { id: "CUS-000512", name: "Paolo Lim", mobile: "09185557821", onlineOrders: 4, walkInOrders: 1, lifetimeSpend: 1_210, favoriteProduct: "Chicken Chops", segment: "returning", joinedAt: daysAgo(21), lastOrderAt: daysAgo(0) },
    { id: "CUS-000391", name: "Mika Fernandez", mobile: "09281234890", onlineOrders: 15, walkInOrders: 4, lifetimeSpend: 3_925, favoriteProduct: "Chicken Poppers", segment: "high_value", joinedAt: daysAgo(88), lastOrderAt: daysAgo(0) },
    { id: "CUS-000207", name: "Jessa Cruz", mobile: "09223456781", onlineOrders: 19, walkInOrders: 8, lifetimeSpend: 4_610, favoriteProduct: "Chicken Chops", favoriteFlavor: "Salted Egg", segment: "high_value", joinedAt: daysAgo(140), lastOrderAt: daysAgo(0) },
    { id: "CUS-000318", name: "Rafael Tan", mobile: "09175550123", onlineOrders: 3, walkInOrders: 0, lifetimeSpend: 520, favoriteProduct: "Crispy Chicken Sisig", segment: "returning", joinedAt: daysAgo(30), lastOrderAt: daysAgo(0) },
    { id: "CUS-000533", name: "Nina Ocampo", mobile: "09981112233", onlineOrders: 0, walkInOrders: 1, lifetimeSpend: 134, favoriteProduct: "Bam Brew Latte", segment: "new", joinedAt: daysAgo(3), lastOrderAt: daysAgo(3) },
    { id: "CUS-000144", name: "Gabriel Sy", mobile: "09064448812", onlineOrders: 6, walkInOrders: 2, lifetimeSpend: 990, favoriteProduct: "Matcha Latte", segment: "inactive", joinedAt: daysAgo(190), lastOrderAt: daysAgo(47) },
    { id: "CUS-000476", name: "Trisha Gomez", mobile: "09157773490", onlineOrders: 9, walkInOrders: 5, lifetimeSpend: 2_240, favoriteProduct: "Chicken Poppers", segment: "frequent", joinedAt: daysAgo(55), lastOrderAt: daysAgo(1) },
    { id: "CUS-000529", name: "Leo Manalo", mobile: "09201239876", onlineOrders: 1, walkInOrders: 1, lifetimeSpend: 310, favoriteProduct: "Chicken Chops", segment: "new", joinedAt: daysAgo(6), lastOrderAt: daysAgo(4) },
    { id: "CUS-000302", name: "Andrea Villar", mobile: "09479990011", onlineOrders: 2, walkInOrders: 4, lifetimeSpend: 845, favoriteProduct: "Spanish Latte", segment: "returning", joinedAt: daysAgo(40), lastOrderAt: daysAgo(9) },
  ];
}
