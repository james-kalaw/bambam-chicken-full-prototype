// Inventory is ingredient-based (chicken, rice, milk, cups...), not product-based.
// Products connect to ingredients through recipes (bill of materials).

export type StockStatus = "healthy" | "low" | "critical" | "out";

export type InventoryCategory =
  | "Protein"
  | "Rice & Grains"
  | "Sauces & Dips"
  | "Dairy"
  | "Coffee & Tea"
  | "Packaging";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  /** Units are NOT confirmed with Bambam yet; these are demo units */
  unit: string;
  lowStockThreshold: number;
  criticalThreshold: number;
  /** Demo cost per unit, in pesos */
  unitCost: number;
  lastUpdated: string;
}

export type InventoryTransactionType =
  | "Stock In"
  | "Sale Usage"
  | "Waste"
  | "Spoilage"
  | "Complimentary Food"
  | "Staff Meal"
  | "Adjustment"
  | "Damaged"
  | "Other Stock Out";

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryTransactionType;
  /** Positive = stock added, negative = stock removed */
  change: number;
  unit: string;
  note?: string;
  /** Queue number of the order that used this stock (Sale Usage) */
  relatedOrder?: string;
  /** Stock In only — optional, entered by the owner */
  purchaseCost?: number;
  supplier?: string;
  receivedDate?: string;
  by: string;
  createdAt: string;
}

/** One ingredient line inside a product recipe */
export interface RecipeLine {
  ingredientId: string;
  quantity: number;
}
