import type { InventoryItem, InventoryTransaction, RecipeLine } from "@/types/inventory";

// DEMO INVENTORY — units, quantities, thresholds and costs are placeholders.
// Exact units and costs must be confirmed with Bambam.

const today = () => new Date().toISOString();

export function createInventory(): InventoryItem[] {
  const now = today();
  return [
    { id: "chicken", name: "Chicken (boneless)", category: "Protein", quantity: 9.45, unit: "kg", lowStockThreshold: 10, criticalThreshold: 5, unitCost: 280, lastUpdated: now },
    { id: "breading", name: "Breading Mix", category: "Protein", quantity: 6, unit: "kg", lowStockThreshold: 3, criticalThreshold: 1.5, unitCost: 95, lastUpdated: now },
    { id: "oil", name: "Cooking Oil", category: "Protein", quantity: 14, unit: "L", lowStockThreshold: 5, criticalThreshold: 2, unitCost: 110, lastUpdated: now },
    { id: "rice", name: "Rice", category: "Rice & Grains", quantity: 22, unit: "kg", lowStockThreshold: 8, criticalThreshold: 4, unitCost: 52, lastUpdated: now },
    { id: "sauce-parmesan", name: "Garlic Parmesan Sauce", category: "Sauces & Dips", quantity: 2.4, unit: "L", lowStockThreshold: 2, criticalThreshold: 1, unitCost: 320, lastUpdated: now },
    { id: "sauce-honey", name: "Honey Butter Sauce", category: "Sauces & Dips", quantity: 3, unit: "L", lowStockThreshold: 1.5, criticalThreshold: 0.75, unitCost: 260, lastUpdated: now },
    { id: "sauce-buffalo", name: "Buffalo Sauce", category: "Sauces & Dips", quantity: 1.1, unit: "L", lowStockThreshold: 1.5, criticalThreshold: 0.75, unitCost: 280, lastUpdated: now },
    { id: "dip-mayo", name: "Garlic Mayo Dip", category: "Sauces & Dips", quantity: 3.5, unit: "L", lowStockThreshold: 1.5, criticalThreshold: 0.75, unitCost: 210, lastUpdated: now },
    { id: "dip-cheese", name: "Cheese Sauce", category: "Sauces & Dips", quantity: 2.8, unit: "L", lowStockThreshold: 1.5, criticalThreshold: 0.75, unitCost: 240, lastUpdated: now },
    { id: "coffee-beans", name: "Coffee Beans", category: "Coffee & Tea", quantity: 1.6, unit: "kg", lowStockThreshold: 2, criticalThreshold: 1, unitCost: 850, lastUpdated: now },
    { id: "matcha", name: "Matcha Powder", category: "Coffee & Tea", quantity: 0.9, unit: "kg", lowStockThreshold: 0.5, criticalThreshold: 0.25, unitCost: 1400, lastUpdated: now },
    { id: "milk", name: "Fresh Milk", category: "Dairy", quantity: 9, unit: "L", lowStockThreshold: 6, criticalThreshold: 3, unitCost: 95, lastUpdated: now },
    { id: "condensed-milk", name: "Condensed Milk", category: "Dairy", quantity: 0.8, unit: "L", lowStockThreshold: 2, criticalThreshold: 1, unitCost: 120, lastUpdated: now },
    { id: "coffee-jelly", name: "Coffee Jelly", category: "Coffee & Tea", quantity: 2, unit: "kg", lowStockThreshold: 1, criticalThreshold: 0.5, unitCost: 150, lastUpdated: now },
    { id: "pearls", name: "Tapioca Pearls", category: "Coffee & Tea", quantity: 0, unit: "kg", lowStockThreshold: 1, criticalThreshold: 0.5, unitCost: 130, lastUpdated: now },
    { id: "cups", name: "16 oz Cups + Lids", category: "Packaging", quantity: 140, unit: "pcs", lowStockThreshold: 100, criticalThreshold: 50, unitCost: 6, lastUpdated: now },
    { id: "meal-box", name: "Meal Boxes", category: "Packaging", quantity: 120, unit: "pcs", lowStockThreshold: 80, criticalThreshold: 40, unitCost: 8, lastUpdated: now },
    { id: "paper-bag", name: "Paper Bags", category: "Packaging", quantity: 210, unit: "pcs", lowStockThreshold: 60, criticalThreshold: 30, unitCost: 4, lastUpdated: now },
  ];
}

export function createInventoryLog(): InventoryTransaction[] {
  const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  return [
    { id: "itx-1", itemId: "chicken", itemName: "Chicken (boneless)", type: "Stock In", change: 6, unit: "kg", note: "Morning delivery", receivedDate: new Date().toISOString().slice(0, 10), by: "Carla Mendoza", createdAt: minsAgo(260) },
    { id: "itx-2", itemId: "rice", itemName: "Rice", type: "Sale Usage", change: -0.3, unit: "kg", relatedOrder: "P-026", by: "System", createdAt: minsAgo(66) },
    { id: "itx-3", itemId: "milk", itemName: "Fresh Milk", type: "Spoilage", change: -1, unit: "L", note: "Past expiry", by: "Carla Mendoza", createdAt: minsAgo(95) },
    { id: "itx-4", itemId: "chicken", itemName: "Chicken (boneless)", type: "Staff Meal", change: -0.4, unit: "kg", by: "Marco Reyes", createdAt: minsAgo(60) },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// RECIPES / BILL OF MATERIALS (DEMO QUANTITIES)
// productRecipes: used for every unit of the product
// choiceRecipes:  extra ingredients when a specific option is picked
// ─────────────────────────────────────────────────────────────────────────────

export const productRecipes: Record<string, RecipeLine[]> = {
  "chicken-chops": [
    { ingredientId: "chicken", quantity: 0.18 },
    { ingredientId: "breading", quantity: 0.03 },
    { ingredientId: "oil", quantity: 0.05 },
    { ingredientId: "meal-box", quantity: 1 },
  ],
  "chicken-poppers": [
    { ingredientId: "chicken", quantity: 0.15 },
    { ingredientId: "breading", quantity: 0.03 },
    { ingredientId: "oil", quantity: 0.05 },
    { ingredientId: "meal-box", quantity: 1 },
  ],
  "chicken-sisig": [
    { ingredientId: "chicken", quantity: 0.16 },
    { ingredientId: "rice", quantity: 0.15 },
    { ingredientId: "meal-box", quantity: 1 },
  ],
  "chicken-sandwich": [
    { ingredientId: "chicken", quantity: 0.12 },
    { ingredientId: "meal-box", quantity: 1 },
  ],
  "chicken-wings": [
    { ingredientId: "chicken", quantity: 0.3 },
    { ingredientId: "meal-box", quantity: 1 },
  ],
  latte: [
    { ingredientId: "coffee-beans", quantity: 0.018 },
    { ingredientId: "milk", quantity: 0.2 },
    { ingredientId: "cups", quantity: 1 },
  ],
  "flavored-latte": [
    { ingredientId: "coffee-beans", quantity: 0.018 },
    { ingredientId: "milk", quantity: 0.2 },
    { ingredientId: "cups", quantity: 1 },
  ],
  "spanish-latte": [
    { ingredientId: "coffee-beans", quantity: 0.018 },
    { ingredientId: "milk", quantity: 0.18 },
    { ingredientId: "condensed-milk", quantity: 0.03 },
    { ingredientId: "cups", quantity: 1 },
  ],
  americano: [
    { ingredientId: "coffee-beans", quantity: 0.018 },
    { ingredientId: "cups", quantity: 1 },
  ],
  "matcha-latte": [
    { ingredientId: "matcha", quantity: 0.01 },
    { ingredientId: "milk", quantity: 0.2 },
    { ingredientId: "cups", quantity: 1 },
  ],
  chocolate: [
    { ingredientId: "milk", quantity: 0.2 },
    { ingredientId: "cups", quantity: 1 },
  ],
  "plain-rice": [{ ingredientId: "rice", quantity: 0.15 }],
};

export const choiceRecipes: Record<string, RecipeLine[]> = {
  "rice-meal": [{ ingredientId: "rice", quantity: 0.15 }],
  "extra-rice": [{ ingredientId: "rice", quantity: 0.15 }],
  "garlic-parmesan": [{ ingredientId: "sauce-parmesan", quantity: 0.04 }],
  "honey-butter": [{ ingredientId: "sauce-honey", quantity: 0.04 }],
  buffalo: [{ ingredientId: "sauce-buffalo", quantity: 0.04 }],
  "garlic-mayo": [{ ingredientId: "dip-mayo", quantity: 0.03 }],
  "cheese-sauce": [{ ingredientId: "dip-cheese", quantity: 0.03 }],
  "coffee-jelly": [{ ingredientId: "coffee-jelly", quantity: 0.05 }],
  pearls: [{ ingredientId: "pearls", quantity: 0.05 }],
};
