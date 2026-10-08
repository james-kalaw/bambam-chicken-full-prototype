import type { OptionGroup, Product, ProductCategory } from "@/types/product";

// DEMO MENU — names follow the proposal brief; prices and options are
// placeholders. Replace with Bambam's actual menu before going live.

export const CATEGORIES: { id: ProductCategory; label: string; posLabel: string; emoji: string }[] = [
  { id: "chicken", label: "Chicken Meals", posLabel: "CHICKEN", emoji: "🍗" },
  { id: "coffee", label: "Bam Brew Coffee", posLabel: "COFFEE", emoji: "☕" },
  { id: "drinks", label: "Non-Coffee Drinks", posLabel: "DRINKS", emoji: "🧋" },
  { id: "add-ons", label: "Add-ons & Sides", posLabel: "ADD-ONS", emoji: "🍟" },
];

// Option groups shared by several products are defined once.

const chickenServing: OptionGroup = {
  id: "serving",
  label: "Choose serving",
  type: "single",
  required: true,
  choices: [
    { id: "a-la-carte", label: "A La Carte", priceDelta: 0 },
    { id: "rice-meal", label: "Rice Meal", priceDelta: 20 },
  ],
};

const chickenFlavor: OptionGroup = {
  id: "flavor",
  label: "Choose flavor",
  type: "single",
  required: true,
  choices: [
    { id: "garlic-parmesan", label: "Creamy Garlic Parmesan", priceDelta: 0 },
    { id: "honey-butter", label: "Honey Butter", priceDelta: 0 },
    { id: "buffalo", label: "Spicy Buffalo", priceDelta: 0 },
    { id: "soy-garlic", label: "Soy Garlic", priceDelta: 0 },
    { id: "salted-egg", label: "Salted Egg", priceDelta: 10 },
  ],
};

const chickenDip: OptionGroup = {
  id: "dip",
  label: "Choose dip",
  type: "single",
  required: true,
  choices: [
    { id: "garlic-mayo", label: "Garlic Mayo", priceDelta: 0 },
    { id: "cheese-sauce", label: "Cheese Sauce", priceDelta: 0 },
    { id: "sweet-chili", label: "Sweet Chili", priceDelta: 0 },
  ],
};

const chickenAddOns: OptionGroup = {
  id: "add-ons",
  label: "Add-ons",
  type: "multiple",
  required: false,
  maxSelect: 3,
  choices: [
    { id: "extra-rice", label: "Extra Rice", priceDelta: 20 },
    { id: "extra-dip", label: "Extra Dip", priceDelta: 15 },
    { id: "fried-egg", label: "Fried Egg", priceDelta: 15 },
    { id: "fries", label: "Side of Fries", priceDelta: 40 },
  ],
};

const temperature: OptionGroup = {
  id: "temperature",
  label: "Hot or iced?",
  type: "single",
  required: true,
  choices: [
    { id: "iced", label: "Iced", priceDelta: 0 },
    { id: "hot", label: "Hot", priceDelta: 0 },
  ],
};

const drinkUpgrade: OptionGroup = {
  id: "upgrade",
  label: "Upgrade",
  type: "single",
  required: true,
  defaultChoiceId: "regular",
  choices: [
    { id: "regular", label: "Regular (16 oz)", priceDelta: 0 },
    { id: "large", label: "Large (22 oz)", priceDelta: 20 },
  ],
};

const drinkToppings: OptionGroup = {
  id: "toppings",
  label: "Toppings",
  type: "multiple",
  required: false,
  maxSelect: 2,
  choices: [
    { id: "cream-cheese", label: "Cream Cheese Foam", priceDelta: 25 },
    { id: "caramel-drizzle", label: "Caramel Drizzle", priceDelta: 10 },
  ],
};

const drinkSinkers: OptionGroup = {
  id: "sinkers",
  label: "Sinkers",
  type: "multiple",
  required: false,
  maxSelect: 2,
  choices: [
    { id: "coffee-jelly", label: "Coffee Jelly", priceDelta: 15 },
    { id: "pearls", label: "Tapioca Pearls", priceDelta: 15 },
  ],
};

export const PRODUCTS: Product[] = [
  // ── Chicken ──────────────────────────────────────────────
  {
    id: "chicken-chops",
    name: "Chicken Chops",
    category: "chicken",
    description: "Crispy boneless chicken chops tossed in your favorite Bambam flavor.",
    basePrice: 115,
    emoji: "🍗",
    popular: true,
    availability: "available",
    optionGroups: [chickenServing, chickenFlavor, chickenDip, chickenAddOns],
  },
  {
    id: "chicken-poppers",
    name: "Chicken Poppers",
    category: "chicken",
    description: "Bite-sized chicken poppers, perfect between classes.",
    basePrice: 99,
    emoji: "🍗",
    popular: true,
    availability: "available",
    optionGroups: [chickenServing, chickenFlavor, chickenDip, chickenAddOns],
  },
  {
    id: "chicken-sisig",
    name: "Crispy Chicken Sisig",
    category: "chicken",
    description: "Sizzling crispy chicken sisig served with rice.",
    basePrice: 125,
    emoji: "🍳",
    availability: "available",
    optionGroups: [
      {
        id: "spice",
        label: "Spice level",
        type: "single",
        required: true,
        defaultChoiceId: "regular",
        choices: [
          { id: "mild", label: "Mild", priceDelta: 0 },
          { id: "regular", label: "Regular", priceDelta: 0 },
          { id: "spicy", label: "Extra Spicy", priceDelta: 0 },
        ],
      },
      chickenAddOns,
    ],
  },
  {
    id: "chicken-sandwich",
    name: "Chicken Sandwich",
    category: "chicken",
    description: "Crispy chicken fillet in a soft bun. (Demo item for the pitch.)",
    basePrice: 109,
    emoji: "🥪",
    availability: "available",
    optionGroups: [],
  },
  {
    id: "chicken-wings",
    name: "Bambam Wings (6 pcs)",
    category: "chicken",
    description: "Six glazed wings for sharing — or not.",
    basePrice: 169,
    emoji: "🍗",
    availability: "sold_out",
    optionGroups: [chickenFlavor, chickenDip],
  },

  // ── Bam Brew coffee ──────────────────────────────────────
  {
    id: "latte",
    name: "Bam Brew Latte",
    category: "coffee",
    description: "Our house espresso with fresh milk. Hot or iced.",
    basePrice: 99,
    emoji: "☕",
    popular: true,
    availability: "available",
    optionGroups: [temperature, drinkUpgrade, drinkToppings, drinkSinkers],
  },
  {
    id: "flavored-latte",
    name: "Flavored Latte",
    category: "coffee",
    description: "Latte with your choice of syrup flavor.",
    basePrice: 115,
    emoji: "☕",
    availability: "available",
    optionGroups: [
      temperature,
      {
        id: "flavor",
        label: "Choose flavor",
        type: "single",
        required: true,
        choices: [
          { id: "vanilla", label: "Vanilla", priceDelta: 0 },
          { id: "hazelnut", label: "Hazelnut", priceDelta: 0 },
          { id: "caramel", label: "Caramel", priceDelta: 0 },
          { id: "salted-caramel", label: "Salted Caramel", priceDelta: 10 },
        ],
      },
      drinkUpgrade,
      drinkToppings,
      drinkSinkers,
    ],
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    category: "coffee",
    description: "Sweet and creamy latte with condensed milk.",
    basePrice: 115,
    emoji: "☕",
    availability: "available",
    optionGroups: [temperature, drinkUpgrade, drinkSinkers],
  },
  {
    id: "americano",
    name: "Americano",
    category: "coffee",
    description: "Bold espresso and water. Simple and strong.",
    basePrice: 85,
    emoji: "☕",
    availability: "available",
    optionGroups: [temperature, drinkUpgrade],
  },

  // ── Non-coffee drinks ────────────────────────────────────
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    category: "drinks",
    description: "Earthy matcha with fresh milk. No coffee.",
    basePrice: 120,
    emoji: "🍵",
    popular: true,
    availability: "available",
    optionGroups: [temperature, drinkUpgrade, drinkToppings, drinkSinkers],
  },
  {
    id: "chocolate",
    name: "Bambam Chocolate",
    category: "drinks",
    description: "Rich chocolate drink. A non-coffee favorite.",
    basePrice: 99,
    emoji: "🍫",
    availability: "available",
    optionGroups: [temperature, drinkUpgrade, drinkToppings, drinkSinkers],
  },
  {
    id: "strawberry-milk",
    name: "Strawberry Milk",
    category: "drinks",
    description: "Iced fresh milk with strawberry purée.",
    basePrice: 105,
    emoji: "🍓",
    availability: "unavailable",
    optionGroups: [drinkUpgrade, drinkSinkers],
  },
  {
    id: "iced-tea",
    name: "House Iced Tea",
    category: "drinks",
    description: "Refreshing lemon iced tea.",
    basePrice: 65,
    emoji: "🧋",
    availability: "available",
    optionGroups: [drinkUpgrade],
  },

  // ── Add-ons & sides ──────────────────────────────────────
  {
    id: "plain-rice",
    name: "Plain Rice",
    category: "add-ons",
    description: "One cup of steamed rice.",
    basePrice: 20,
    emoji: "🍚",
    availability: "available",
    optionGroups: [],
  },
  {
    id: "fries",
    name: "Fries",
    category: "add-ons",
    description: "Crispy fries with a pinch of salt.",
    basePrice: 55,
    emoji: "🍟",
    availability: "available",
    optionGroups: [],
  },
  {
    id: "extra-dip",
    name: "Extra Dip",
    category: "add-ons",
    description: "Garlic Mayo, Cheese Sauce, or Sweet Chili.",
    basePrice: 15,
    emoji: "🥣",
    availability: "available",
    optionGroups: [chickenDip],
  },
  {
    id: "water",
    name: "Bottled Water",
    category: "add-ons",
    description: "500 ml bottled water.",
    basePrice: 25,
    emoji: "💧",
    availability: "available",
    optionGroups: [],
  },
];
