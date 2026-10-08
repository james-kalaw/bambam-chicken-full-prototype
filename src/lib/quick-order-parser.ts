// ─────────────────────────────────────────────────────────────────────────────
// AI QUICK ORDER — SIMULATED
// No AI service is called. This file reads the cashier's typed order and
// matches words against the CURRENT Bambam menu only.
//
// Rules:
// - Never invent menu items: anything that doesn't match is reported.
// - Never silently guess: unclear parts become questions for the cashier.
// - Never submit: the result is only a DRAFT that the cashier confirms.
//
// Later, a real AI model (through FastAPI) can replace parseQuickOrder()
// as long as it returns the same QuickOrderDraft shape.
// ─────────────────────────────────────────────────────────────────────────────

import { buildOrderItem, getProduct } from "@/lib/order-utils";
import type { OrderGroup, OrderItem, OrderType, PaymentMethod } from "@/types/order";
import type { Product } from "@/types/product";

/** One single unit (quantity 1) of a product, before identical units are merged */
export interface DraftUnit {
  id: string;
  /** 1-based person number in a group order (1 when it's not a group) */
  person: number;
  productId: string;
  choiceIds: string[];
  /** Choices filled from the menu's configured default (shown as "default") */
  defaulted: string[];
  /** Set when the product itself was unclear, e.g. "chicken" */
  candidates?: string[];
}

export type ClarificationAction =
  | { type: "keep" }
  | { type: "only_last"; unitIds: string[]; choiceId: string }
  | { type: "set_product"; unitIds: string[]; productId: string };

export interface Clarification {
  id: string;
  question: string;
  options: { label: string; action: ClarificationAction }[];
}

export interface QuickOrderDraft {
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
  /** Number of people (1 = normal order) */
  people: number;
  units: DraftUnit[];
  /** Phrases that didn't match the menu */
  unmatched: string[];
  clarifications: Clarification[];
}

// ── Vocabulary ───────────────────────────────────────────────────────────────

const PRODUCT_ALIASES: { text: string; productId: string; choices?: string[] }[] = [
  { text: "chicken chops", productId: "chicken-chops" },
  { text: "chops", productId: "chicken-chops" },
  { text: "chicken poppers", productId: "chicken-poppers" },
  { text: "poppers", productId: "chicken-poppers" },
  { text: "crispy chicken sisig", productId: "chicken-sisig" },
  { text: "chicken sisig", productId: "chicken-sisig" },
  { text: "sisig", productId: "chicken-sisig" },
  { text: "chicken sandwich", productId: "chicken-sandwich" },
  { text: "sandwich", productId: "chicken-sandwich" },
  { text: "bambam wings", productId: "chicken-wings" },
  { text: "wings", productId: "chicken-wings" },
  { text: "salted caramel latte", productId: "flavored-latte", choices: ["salted-caramel"] },
  { text: "caramel latte", productId: "flavored-latte", choices: ["caramel"] },
  { text: "vanilla latte", productId: "flavored-latte", choices: ["vanilla"] },
  { text: "hazelnut latte", productId: "flavored-latte", choices: ["hazelnut"] },
  { text: "flavored latte", productId: "flavored-latte" },
  { text: "spanish latte", productId: "spanish-latte" },
  { text: "matcha latte", productId: "matcha-latte" },
  { text: "matcha", productId: "matcha-latte" },
  { text: "bam brew latte", productId: "latte" },
  { text: "latte", productId: "latte" },
  { text: "americano", productId: "americano" },
  { text: "chocolate", productId: "chocolate" },
  { text: "strawberry milk", productId: "strawberry-milk" },
  { text: "house iced tea", productId: "iced-tea" },
  { text: "iced tea", productId: "iced-tea" },
  { text: "plain rice", productId: "plain-rice" },
  { text: "rice", productId: "plain-rice" },
  { text: "fries", productId: "fries" },
  { text: "bottled water", productId: "water" },
  { text: "water", productId: "water" },
];

/** Words that could mean more than one product → ask the cashier */
const AMBIGUOUS_ALIASES: { text: string; candidates: string[] }[] = [
  { text: "chicken", candidates: ["chicken-chops", "chicken-poppers"] },
];

/** Extra ways people say an option. Otherwise the option's own label is used. */
const CHOICE_ALIASES: Record<string, string[]> = {
  "a-la-carte": ["a la carte", "ala carte", "alacarte", "solo"],
  "rice-meal": ["rice meal", "with rice"],
  "garlic-parmesan": ["creamy garlic parmesan", "garlic parmesan", "parmesan"],
  buffalo: ["spicy buffalo", "buffalo"],
  "cheese-sauce": ["cheese sauce", "cheese dip"],
  "sweet-chili": ["sweet chili", "sweet chilli"],
  "extra-rice": ["extra rice", "additional rice"],
  "fried-egg": ["fried egg", "egg"],
  fries: ["side of fries", "fries"],
  iced: ["iced", "cold"],
  regular: ["regular"],
  large: ["large", "upsize"],
  "cream-cheese": ["cream cheese foam", "cream cheese"],
  pearls: ["tapioca pearls", "pearls", "tapioca", "boba"],
  spicy: ["extra spicy", "spicy"],
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};
const STOPWORDS = new Set([
  "and", "with", "plus", "the", "a", "an", "one", "two", "three", "four", "five", "both", "all", "each", "same", "but",
  "also", "please", "order", "orders", "of", "for", "to", "i", "want", "would", "like", "get", "have", "take", "pcs",
  "piece", "pieces", "them", "us", "me", "then", "too", "is", "are", "as", "their", "his", "her", "x", "other",
]);

/** Option groups where one value for several meals deserves a question */
const ASK_WHEN_SHARED = new Set(["flavor", "dip", "spice"]);

// ── Text helpers ─────────────────────────────────────────────────────────────

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Match { start: number; end: number }

/** Finds `alias` as whole words inside `text`, ignoring parts already used */
function findWord(text: string, alias: string): Match | null {
  const m = new RegExp(`\\b${escape(alias)}\\b`).exec(text);
  return m ? { start: m.index, end: m.index + alias.length } : null;
}

/** Blanks out a matched part so it isn't matched twice (keeps positions stable) */
function consume(text: string, m: Match): string {
  return text.slice(0, m.start) + " ".repeat(m.end - m.start) + text.slice(m.end);
}

function choiceAliases(choiceId: string, label: string): string[] {
  return CHOICE_ALIASES[choiceId] ?? [label.toLowerCase()];
}

/** All option choices of a product mentioned in the text, longest names first */
function matchChoices(text: string, product: Product): { matches: { choiceId: string; groupId: string; span: Match }[]; rest: string } {
  const candidates = product.optionGroups.flatMap((g) =>
    g.choices.flatMap((c) => choiceAliases(c.id, c.label).map((alias) => ({ alias, choiceId: c.id, groupId: g.id }))),
  );
  candidates.sort((a, b) => b.alias.length - a.alias.length);
  let rest = text;
  const matches: { choiceId: string; groupId: string; span: Match }[] = [];
  for (const c of candidates) {
    const span = findWord(rest, c.alias);
    if (span && !matches.some((m) => m.choiceId === c.choiceId)) {
      matches.push({ choiceId: c.choiceId, groupId: c.groupId, span });
      rest = consume(rest, span);
    }
  }
  return { matches, rest };
}

/**
 * Finds the product named in the text (longest name wins). A product word that
 * sits inside a longer option phrase is ignored: "rice" in "rice meal" or
 * "extra rice" is an option, not the Plain Rice product.
 */
function matchProduct(text: string, optionPhrases: string[]): { productId: string; implied: string[]; candidates?: string[]; span: Match } | null {
  const optionSpans = optionPhrases.map((o) => ({ o, span: findWord(text, o) })).filter((x) => x.span) as { o: string; span: Match }[];
  const insideOption = (span: Match) =>
    optionSpans.some((x) => x.span.start <= span.start && x.span.end >= span.end && x.span.end - x.span.start > span.end - span.start);

  for (const a of [...PRODUCT_ALIASES].sort((x, y) => y.text.length - x.text.length)) {
    const span = findWord(text, a.text);
    if (span && !insideOption(span)) return { productId: a.productId, implied: a.choices ?? [], span };
  }
  for (const a of AMBIGUOUS_ALIASES) {
    const span = findWord(text, a.text);
    if (span) return { productId: a.candidates[0], implied: [], candidates: a.candidates, span };
  }
  return null;
}

/** Words left over after matching — if any, the phrase didn't fully match the menu */
function leftover(text: string): string {
  return text
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w) && !(w in NUMBER_WORDS))
    .join(" ");
}

/** Sets one option on a unit; single-choice groups replace the old value */
function setChoice(unit: DraftUnit, product: Product, groupId: string, choiceId: string) {
  const group = product.optionGroups.find((g) => g.id === groupId);
  if (!group) return;
  if (group.type === "single") {
    const others = new Set(group.choices.map((c) => c.id));
    unit.choiceIds = unit.choiceIds.filter((id) => !others.has(id));
    unit.defaulted = unit.defaulted.filter((id) => !others.has(id));
  }
  if (!unit.choiceIds.includes(choiceId)) unit.choiceIds.push(choiceId);
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseQuickOrder(input: string, products: Product[]): QuickOrderDraft {
  let uid = 0;
  const newId = () => `u${++uid}`;
  const productOf = (id: string) => getProduct(id, products)!;
  // Every option phrase on the menu ("rice meal", "extra rice", "side of fries"…)
  const optionPhrases = products.flatMap((p) => p.optionGroups.flatMap((g) => g.choices.flatMap((c) => choiceAliases(c.id, c.label))));

  let text = ` ${input.toLowerCase().replace(/[’']/g, "").replace(/\n/g, ". ")} `;
  // Simple plural clean-up so "meals", "lattes" etc. match
  text = text.replace(/\bmeals\b/g, "meal").replace(/\blattes\b/g, "latte").replace(/\bsandwiches\b/g, "sandwich").replace(/\bwaters\b/g, "water");

  const draft: QuickOrderDraft = { people: 1, units: [], unmatched: [], clarifications: [] };

  // 1. Order type, payment method and group size apply to the whole order
  const take = (re: RegExp) => {
    const m = re.exec(text);
    if (m) text = text.replace(re, " ");
    return m;
  };
  if (take(/\bdine[\s-]?in\b/)) draft.orderType = "dine_in";
  else if (take(/\btake[\s-]?out\b|\bto go\b/)) draft.orderType = "takeout";
  else if (take(/\bpick[\s-]?up\b/)) draft.orderType = "pickup";
  else if (take(/\bdelivery\b|\bdeliver\b/)) draft.orderType = "delivery";

  if (take(/\bg[\s-]?cash\b/)) draft.paymentMethod = "gcash";
  else if (take(/\b(pay)?maya\b/)) draft.paymentMethod = "maya";
  else if (take(/\bbank( transfer)?\b/)) draft.paymentMethod = "bank_transfer";
  else if (take(/\bcash\b/)) draft.paymentMethod = "cash";

  const peopleMatch = take(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(people|persons|pax|students)\b/);
  if (peopleMatch) draft.people = Number(peopleMatch[1]) || NUMBER_WORDS[peopleMatch[1]] || 1;

  // 2. Split into people: "First … Second … Third …" or "Person 1 … Person 2 …"
  const marker = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|person\s*(\d+))\b/g;
  const marks = [...text.matchAll(marker)];
  const segments: { person: number; text: string }[] = [];
  if (marks.length === 0) {
    segments.push({ person: 1, text });
  } else {
    marks.forEach((m, i) => {
      const person = m[2] ? Number(m[2]) : ORDINALS[m[1]];
      const start = (m.index ?? 0) + m[0].length;
      const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
      segments.push({ person, text: text.slice(start, end) });
    });
  }

  // 3. Read each person's part, clause by clause
  for (const seg of segments) {
    let segText = seg.text.trim();
    let lastUnits: DraftUnit[] = [];

    // "same but soy garlic extra rice" → copy the previous person's items, then change them
    const same = /^[\s.:,-]*same\b(\s+as\s+(\w+))?(\s+(but|with|and))?/.exec(segText);
    if (same) {
      const copyFrom = draft.units.filter((u) => u.person === seg.person - 1);
      if (copyFrom.length === 0) draft.unmatched.push(`same (no previous person to copy)`);
      lastUnits = copyFrom.map((u) => ({ ...u, id: newId(), person: seg.person, choiceIds: [...u.choiceIds], defaulted: [...u.defaulted] }));
      draft.units.push(...lastUnits);
      segText = segText.slice(same[0].length);
      // Everything after "same" modifies ALL copied items
      for (const u of lastUnits) {
        const { matches } = matchChoices(` ${segText} `, productOf(u.productId));
        for (const m of matches) setChoice(u, productOf(u.productId), m.groupId, m.choiceId);
      }
      const rest = lastUnits[0] ? matchChoices(` ${segText} `, productOf(lastUnits[0].productId)).rest : segText;
      const left = leftover(rest.replace(/[,.;:+]/g, " "));
      if (left) draft.unmatched.push(left);
      continue;
    }

    // Split on commas, periods, "and", "with", "plus"
    const parts = segText.split(/(,|;|\.|\band\b|\bwith\b|\bplus\b|\+)/);
    let previousSeparator = "";
    for (const raw of parts) {
      if (/^(,|;|\.|and|with|plus|\+)$/.test(raw.trim())) {
        previousSeparator = raw.trim();
        continue;
      }
      const clause = ` ${raw.trim()} `;
      if (!raw.trim()) continue;
      const isAddOnHint = ["with", "plus", "+"].includes(previousSeparator);
      previousSeparator = "";

      // Quantity or scope at the start: "2", "one", "both", "all"
      const q = /^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an|both|all|each)\b/.exec(clause);
      const qWord = q?.[1];
      const scope: "one" | "all" | null = qWord === "both" || qWord === "all" || qWord === "each" ? "all" : qWord === "one" || qWord === "a" || qWord === "an" ? "one" : null;
      const quantity = qWord ? Number(qWord) || NUMBER_WORDS[qWord] || 1 : 1;

      const lastProduct = lastUnits[0] ? productOf(lastUnits[0].productId) : null;
      const onLast = lastProduct ? matchChoices(clause, lastProduct) : null;
      const product = matchProduct(clause, optionPhrases);

      // Is this a new item, or a change to the previous item?
      // e.g. "extra rice" contains "rice" (a product) but is really an add-on.
      const productInsideChoice = !!(product && onLast?.matches.some((m) => m.span.start <= product.span.start && m.span.end >= product.span.end));
      const treatAsModifier = !!onLast && onLast.matches.length > 0 && (!product || productInsideChoice || (isAddOnHint && onLast.matches.length > 0) || scope === "all");

      if (product && !treatAsModifier) {
        // ── New item(s) ──
        const p = productOf(product.productId);
        const afterProduct = consume(clause, product.span);
        const { matches, rest } = matchChoices(afterProduct, p);
        const units: DraftUnit[] = Array.from({ length: Math.max(1, quantity) }, () => ({
          id: newId(), person: seg.person, productId: p.id, choiceIds: [], defaulted: [], candidates: product.candidates,
        }));
        for (const u of units) {
          for (const c of product.implied) setChoice(u, p, p.optionGroups.find((g) => g.choices.some((x) => x.id === c))?.id ?? "", c);
          for (const m of matches) setChoice(u, p, m.groupId, m.choiceId);
        }
        draft.units.push(...units);
        lastUnits = units;

        if (product.candidates) {
          draft.clarifications.push({
            id: `which-${units[0].id}`,
            question: `Which chicken did they mean${units.length > 1 ? ` (${units.length} items)` : ""}?`,
            options: product.candidates.map((id) => ({ label: productOf(id).name, action: { type: "set_product", unitIds: units.map((u) => u.id), productId: id } })),
          });
        }
        // "2 … soy garlic" → were BOTH meals soy garlic?
        for (const m of matches) {
          if (units.length > 1 && ASK_WHEN_SHARED.has(m.groupId)) {
            const label = p.optionGroups.flatMap((g) => g.choices).find((c) => c.id === m.choiceId)?.label;
            draft.clarifications.push({
              id: `shared-${units[0].id}-${m.choiceId}`,
              question: units.length === 2 ? `Are both meals ${label}?` : `Are all ${units.length} meals ${label}?`,
              options: [
                { label: units.length === 2 ? "Yes, both" : "Yes, all", action: { type: "keep" } },
                { label: "No — only one", action: { type: "only_last", unitIds: units.map((u) => u.id), choiceId: m.choiceId } },
              ],
            });
          }
        }
        const left = leftover(rest);
        if (left) draft.unmatched.push(left);
      } else if (lastProduct && onLast && onLast.matches.length > 0) {
        // ── Change to the previous item(s): "one honey butter", "both garlic mayo", "with egg" ──
        for (const m of onLast.matches) {
          const group = lastProduct.optionGroups.find((g) => g.id === m.groupId)!;
          let targets: DraftUnit[];
          if (scope === "all" || lastUnits.length === 1) targets = lastUnits;
          else if (scope === "one") {
            // single choice → the next item that doesn't have one yet; add-on → the latest item
            const free = group.type === "single" ? lastUnits.find((u) => !u.choiceIds.some((id) => group.choices.some((c) => c.id === id))) : undefined;
            targets = [free ?? lastUnits[lastUnits.length - 1]];
          } else {
            targets = lastUnits;
            const label = group.choices.find((c) => c.id === m.choiceId)?.label;
            draft.clarifications.push({
              id: `shared-${lastUnits[0].id}-${m.choiceId}`,
              question: group.type === "single" ? `Are all ${lastUnits.length} items ${label}?` : `Add ${label} to all ${lastUnits.length} items?`,
              options: [
                { label: "Yes, all", action: { type: "keep" } },
                { label: "Only one", action: { type: "only_last", unitIds: lastUnits.map((u) => u.id), choiceId: m.choiceId } },
              ],
            });
          }
          for (const u of targets) setChoice(u, lastProduct, m.groupId, m.choiceId);
        }
        const left = leftover(onLast.rest);
        if (left) draft.unmatched.push(left);
      } else {
        // ── Nothing matched ──
        const left = leftover(clause);
        if (left) draft.unmatched.push(left);
      }
    }
  }

  draft.people = Math.max(draft.people, ...draft.units.map((u) => u.person), 1);
  applyDefaults(draft, products);
  return draft;
}

/** Fills configured defaults (e.g. Regular size) and marks them so the cashier can see */
function applyDefaults(draft: QuickOrderDraft, products: Product[]) {
  for (const u of draft.units) {
    const p = getProduct(u.productId, products);
    if (!p) continue;
    for (const g of p.optionGroups) {
      const has = u.choiceIds.some((id) => g.choices.some((c) => c.id === id));
      if (!has && g.required && g.defaultChoiceId) {
        u.choiceIds.push(g.defaultChoiceId);
        u.defaulted.push(g.defaultChoiceId);
      }
    }
  }
}

// ── After parsing ────────────────────────────────────────────────────────────

/** Required options nobody mentioned (dip, flavor, serving…), grouped for one-tap answers */
export function missingChoices(draft: QuickOrderDraft, products: Product[]) {
  const buckets = new Map<string, { groupId: string; label: string; choices: { id: string; label: string }[]; unitIds: string[]; names: string[] }>();
  for (const u of draft.units) {
    const p = getProduct(u.productId, products);
    if (!p) continue;
    for (const g of p.optionGroups) {
      if (!g.required || g.type !== "single") continue;
      if (u.choiceIds.some((id) => g.choices.some((c) => c.id === id))) continue;
      const bucket = buckets.get(g.id) ?? {
        groupId: g.id,
        label: capitalize(g.label.replace(/^Choose /i, "").replace(/\?$/, "")),
        choices: g.choices.map((c) => ({ id: c.id, label: c.label })),
        unitIds: [],
        names: [],
      };
      bucket.unitIds.push(u.id);
      bucket.names.push(draft.people > 1 ? `P${u.person} ${p.name}` : p.name);
      buckets.set(g.id, bucket);
    }
  }
  // "Chicken Chops, Chicken Chops" → "2× Chicken Chops"
  return [...buckets.values()].map((b) => ({ ...b, summary: compactNames(b.names) }));
}

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function compactNames(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts].map(([n, c]) => (c > 1 ? `${c}× ${n}` : n)).join(", ");
}

export function applyChoiceToUnits(draft: QuickOrderDraft, products: Product[], unitIds: string[], groupId: string, choiceId: string): QuickOrderDraft {
  const units = draft.units.map((u) => {
    if (!unitIds.includes(u.id)) return u;
    const copy = { ...u, choiceIds: [...u.choiceIds], defaulted: [...u.defaulted] };
    setChoice(copy, getProduct(u.productId, products)!, groupId, choiceId);
    return copy;
  });
  return { ...draft, units };
}

export function resolveClarification(draft: QuickOrderDraft, products: Product[], clarificationId: string, action: ClarificationAction): QuickOrderDraft {
  let units = draft.units;
  if (action.type === "only_last") {
    const lastId = action.unitIds[action.unitIds.length - 1];
    units = units.map((u) => (action.unitIds.includes(u.id) && u.id !== lastId ? { ...u, choiceIds: u.choiceIds.filter((c) => c !== action.choiceId) } : u));
  } else if (action.type === "set_product") {
    const p = getProduct(action.productId, products)!;
    const valid = new Set(p.optionGroups.flatMap((g) => g.choices.map((c) => c.id)));
    units = units.map((u) =>
      action.unitIds.includes(u.id) ? { ...u, productId: p.id, candidates: undefined, choiceIds: u.choiceIds.filter((c) => valid.has(c)) } : u,
    );
  }
  return { ...draft, units, clarifications: draft.clarifications.filter((c) => c.id !== clarificationId) };
}

/** Identical units of the same person become one line with a quantity */
export function draftLines(draft: QuickOrderDraft) {
  const lines: { key: string; person: number; productId: string; choiceIds: string[]; defaulted: string[]; quantity: number }[] = [];
  for (const u of draft.units) {
    const key = `${u.person}|${u.productId}|${[...u.choiceIds].sort().join(",")}`;
    const existing = lines.find((l) => l.key === key);
    if (existing) existing.quantity += 1;
    else lines.push({ key, person: u.person, productId: u.productId, choiceIds: u.choiceIds, defaulted: u.defaulted, quantity: 1 });
  }
  return lines;
}

/** Converts a reviewed draft into POS items (and person groups for group orders) */
export function draftToOrder(draft: QuickOrderDraft, products: Product[]): { items: OrderItem[]; groups: OrderGroup[] } {
  const groups: OrderGroup[] = Array.from({ length: Math.max(1, draft.people) }, (_, i) => ({ id: `g${i + 1}`, label: `Person ${i + 1}` }));
  const items = draftLines(draft).map((l) => buildOrderItem(l.productId, l.choiceIds, l.quantity, { products, groupId: `g${l.person}` }));
  return { items, groups };
}

export const QUICK_ORDER_EXAMPLES = [
  "2 chicken chops rice meal, one honey butter and one soy garlic, both garlic mayo, one extra rice, one iced caramel latte with coffee jelly, takeout, cash",
  "5 people dine in. First chicken chops honey butter rice meal. Second same but soy garlic extra rice. Third sandwich and iced latte. Fourth poppers and water. Fifth chicken chops garlic parmesan with egg. Cash.",
  "2 chicken rice meals soy garlic, takeout",
  "1 spicy nuggets and 1 iced latte, gcash",
];
