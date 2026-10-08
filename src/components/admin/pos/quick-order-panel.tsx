"use client";

import { AlertTriangle, Check, HelpCircle, Pencil, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mascot } from "@/components/shared/mascot";
import { getProduct, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import {
  applyChoiceToUnits, draftLines, draftToOrder, missingChoices, parseQuickOrder, QUICK_ORDER_EXAMPLES,
  resolveClarification, type QuickOrderDraft,
} from "@/lib/quick-order-parser";
import { useDemoStore } from "@/lib/store";
import type { OrderGroup, OrderItem, OrderType, PaymentMethod } from "@/types/order";

export interface QuickOrderResult {
  items: OrderItem[];
  groups: OrderGroup[];
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
}

/**
 * AI QUICK ORDER (simulated): the cashier types the order the way the customer
 * says it. Bambam turns it into a draft. AI interprets — the cashier confirms.
 * Nothing is submitted from here; confirming only fills the order panel.
 */
export function QuickOrderPanel({ onConfirm, onEdit }: { onConfirm: (r: QuickOrderResult) => void; onEdit: (r: QuickOrderResult) => void }) {
  const { products } = useDemoStore();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState<QuickOrderDraft | null>(null);

  function interpret(value = text) {
    if (!value.trim()) return;
    setThinking(true);
    setDraft(null);
    // Simulated "AI is reading" pause
    setTimeout(() => {
      setDraft(parseQuickOrder(value, products));
      setThinking(false);
    }, 900);
  }

  const missing = draft ? missingChoices(draft, products) : [];
  const ready = !!draft && draft.units.length > 0 && draft.clarifications.length === 0 && missing.length === 0;
  const result = (): QuickOrderResult => ({ ...draftToOrder(draft!, products), orderType: draft!.orderType, paymentMethod: draft!.paymentMethod });

  const lines = draft ? draftLines(draft) : [];
  const people = draft ? Array.from(new Set(lines.map((l) => l.person))).sort((a, b) => a - b) : [];

  return (
    <section aria-label="AI Quick Order" className="space-y-4">
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <Label htmlFor="quick-order" className="text-base font-bold">Type the order the way the customer says it</Label>
        <Textarea
          id="quick-order"
          className="mt-2 min-h-28 text-base"
          placeholder="e.g. 2 chicken chops rice meal, one honey butter and one soy garlic, both garlic mayo, takeout, cash"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) interpret();
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button onClick={() => interpret()} disabled={!text.trim() || thinking} className="h-11 px-5 font-bold">
            <Sparkles /> Interpret order
          </Button>
          <span className="text-xs text-muted-foreground">Ctrl + Enter</span>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Demo examples:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ORDER_EXAMPLES.map((ex, i) => (
              <Button
                key={ex}
                variant="outline"
                size="sm"
                className="h-auto max-w-full py-1 text-left whitespace-normal"
                onClick={() => {
                  setText(ex);
                  interpret(ex);
                }}
              >
                {["Takeout pair", "Group of 5", "Unclear order", "Unknown item"][i]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {thinking && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4" role="status">
          <Mascot mood="chatbot-thinking" size="sm" />
          <p className="font-medium">Bambam is reading the order<span className="animate-pulse">…</span></p>
        </div>
      )}

      {draft && !thinking && (
        <div className="space-y-3 rounded-xl border-2 border-dashed border-bambam-orange/60 bg-card p-4" aria-live="polite">
          <div className="flex items-start gap-3">
            <Mascot mood="chatbot-answering" size="sm" />
            <div>
              <p className="text-xs font-bold tracking-wide text-bambam-red uppercase">Draft — please review</p>
              <p className="text-lg font-black">
                {draft.orderType ? ORDER_TYPE_LABELS[draft.orderType].toUpperCase() : "ORDER TYPE NOT SAID"}
                {draft.people > 1 && ` · ${draft.people} PEOPLE`}
              </p>
              <p className="text-sm text-muted-foreground">
                Payment: {draft.paymentMethod ? PAYMENT_METHOD_LABELS[draft.paymentMethod] : "not mentioned (choose in the order panel)"}
              </p>
            </div>
          </div>

          {/* Lines, grouped per person */}
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No menu items recognized.</p>
          ) : (
            <div className="space-y-2">
              {people.map((person) => (
                <div key={person}>
                  {draft.people > 1 && <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Person {person}</p>}
                  <ul className="space-y-1">
                    {lines.filter((l) => l.person === person).map((l) => {
                      const p = getProduct(l.productId, products);
                      const choiceLabel = (id: string) => p?.optionGroups.flatMap((g) => g.choices).find((c) => c.id === id)?.label ?? id;
                      return (
                        <li key={l.key} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                          <span className="font-semibold">{l.quantity}× {p?.name}</span>
                          {l.choiceIds.length > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              {l.choiceIds.map((id) => `${choiceLabel(id)}${l.defaulted.includes(id) ? " (default)" : ""}`).join(" · ")}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {draft.unmatched.map((u) => (
            <p key={u} className="flex items-start gap-2 rounded-lg bg-danger-soft p-2.5 text-sm text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> I couldn&apos;t match &apos;{u}&apos; to the current Bambam menu.
            </p>
          ))}

          {/* Questions instead of guesses */}
          {draft.clarifications.map((c) => (
            <div key={c.id} className="space-y-2 rounded-lg bg-warning-soft p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><HelpCircle className="size-4" aria-hidden /> {c.question}</p>
              <div className="flex flex-wrap gap-1.5">
                {c.options.map((o) => (
                  <Button key={o.label} size="sm" variant="outline" className="bg-white" onClick={() => setDraft(resolveClarification(draft, products, c.id, o.action))}>
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {missing.map((m) => (
            <div key={m.groupId} className="space-y-2 rounded-lg bg-warning-soft p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <HelpCircle className="size-4" aria-hidden /> {m.label} not mentioned for {m.summary}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {m.choices.map((c) => (
                  <Button key={c.id} size="sm" variant="outline" className="bg-white" onClick={() => setDraft(applyChoiceToUnits(draft, products, m.unitIds, m.groupId, c.id))}>
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="h-12 font-bold" disabled={lines.length === 0} onClick={() => onEdit(result())}>
              <Pencil /> EDIT
            </Button>
            <Button className="h-12 font-bold" disabled={!ready} onClick={() => onConfirm(result())}>
              <Check /> CONFIRM ORDER
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            AI interprets, you confirm. Confirming fills the order panel — the order is only sent after you take payment.
          </p>
        </div>
      )}
    </section>
  );
}
