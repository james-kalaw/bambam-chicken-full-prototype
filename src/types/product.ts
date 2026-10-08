// Product = a menu item. Instead of creating every combination as its own
// product (e.g. "Chicken Chops Rice Meal Garlic Parmesan"), each product has
// option groups (serving, flavor, dip, add-ons...) that the customer picks from.

export type ProductCategory = "chicken" | "coffee" | "drinks" | "add-ons";

export type ProductAvailability = "available" | "unavailable" | "sold_out";

export interface OptionChoice {
  id: string;
  label: string;
  /** Added to the product's base price when selected. 0 = free. */
  priceDelta: number;
}

export interface OptionGroup {
  id: string;
  label: string;
  /** "single" = radio buttons, "multiple" = checkboxes */
  type: "single" | "multiple";
  required: boolean;
  /** Only used for "multiple" groups */
  maxSelect?: number;
  /**
   * Standard choice when the customer doesn't say (e.g. Regular size).
   * Groups WITHOUT a default (flavor, dip, serving) must always be chosen —
   * AI Quick Order asks instead of guessing.
   */
  defaultChoiceId?: string;
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  basePrice: number;
  /** Placeholder visual until real Bambam photos are provided */
  emoji: string;
  /** Path to a real product photo later, e.g. "/products/chicken-chops.jpg" */
  image?: string;
  popular?: boolean;
  availability: ProductAvailability;
  optionGroups: OptionGroup[];
}

/** One selected option, copied onto cart/order lines so history never changes if the menu does. */
export interface SelectedOption {
  groupId: string;
  groupLabel: string;
  choiceId: string;
  choiceLabel: string;
  priceDelta: number;
}
