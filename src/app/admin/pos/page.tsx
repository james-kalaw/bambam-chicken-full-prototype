"use client";

import { Flame, LayoutGrid, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CustomizeDialog } from "@/components/shared/customize-dialog";
import { PosOrderPanel } from "@/components/admin/pos/pos-order-panel";
import { PosReceipt } from "@/components/admin/pos/pos-receipt";
import type { PosPaymentResult } from "@/components/admin/pos/pos-payment";
import { QuickOrderPanel, type QuickOrderResult } from "@/components/admin/pos/quick-order-panel";
import { usePosDraft } from "@/components/admin/pos/use-pos-draft";
import { CATEGORIES } from "@/data/products";
import { peso } from "@/lib/format";
import { buildOrderItem, makeId } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order, OrderItem, PaymentMethod } from "@/types/order";
import type { Product, ProductCategory } from "@/types/product";

// Walk-in POS. Speed first: TAP MORE, TYPE LESS.
// Walk-in orders go straight to the kitchen — no second approval.

type Tab = "popular" | ProductCategory;

/** What the customize dialog is doing right now */
type Editing =
  | { kind: "add"; product: Product }
  | { kind: "edit"; product: Product; item: OrderItem }
  | { kind: "duplicate"; product: Product; item: OrderItem };

export default function PosPage() {
  const { products, createWalkInOrder } = useDemoStore();
  const draft = usePosDraft();
  const [mode, setMode] = useState<"standard" | "ai">("standard");
  const [tab, setTab] = useState<Tab>("popular");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [paymentKey, setPaymentKey] = useState("initial");
  const [aiPayment, setAiPayment] = useState<PaymentMethod | undefined>();

  const visible = tab === "popular" ? products.filter((p) => p.popular) : products.filter((p) => p.category === tab);
  const activeLabel = draft.groups.find((g) => g.id === draft.activeGroupId)?.label;

  function startIfReceipt() {
    if (lastOrder) {
      setLastOrder(null);
      draft.reset();
    }
  }

  function tapProduct(p: Product) {
    if (p.availability !== "available") return;
    startIfReceipt();
    if (p.optionGroups.length === 0) {
      draft.addItem(buildOrderItem(p.id, [], 1, { products }));
      toast.success(`${p.name} added${draft.isGroupOrder ? ` to ${activeLabel}` : ""}`, { duration: 1200 });
    } else {
      setEditing({ kind: "add", product: p });
    }
  }

  function duplicate(item: OrderItem) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    if (product.optionGroups.length === 0) {
      draft.addItem({ ...item, lineId: makeId("line"), groupId: draft.activeGroupId });
      toast.success(`Duplicated to ${activeLabel}`, { duration: 1200 });
    } else {
      // Opens pre-filled — change just the flavor, then add as a NEW line for the selected person
      setEditing({ kind: "duplicate", product, item: { ...item, groupId: draft.activeGroupId } });
    }
  }

  function loadFromAi(r: QuickOrderResult, switchToStandard: boolean) {
    startIfReceipt();
    draft.load({ items: r.items, groups: r.groups, orderType: r.orderType });
    setAiPayment(r.paymentMethod);
    setPaymentKey(makeId("pay"));
    if (switchToStandard) {
      setMode("standard");
      toast.info("Draft loaded into the POS — edit anything, then take payment.");
    } else {
      toast.success("Draft confirmed — now take payment to send it to the kitchen.");
      document.getElementById("pos-order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function confirm(payment: PosPaymentResult) {
    const order = createWalkInOrder({
      items: draft.items,
      groups: draft.groups,
      orderType: draft.orderType,
      customer: draft.customer,
      payment,
    });
    setLastOrder(order);
    setAiPayment(undefined);
    setPaymentKey(makeId("pay"));
    toast.success(`Order ${order.queueNumber} sent to the kitchen${payment.paid && payment.method === "cash" ? ` · change ${peso(order.payment.changeGiven ?? 0)}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">POS</h1>
        <div className="inline-flex rounded-xl border bg-card p-1" role="radiogroup" aria-label="POS mode">
          {([["standard", "STANDARD POS", LayoutGrid], ["ai", "AI QUICK ORDER", Sparkles]] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn("inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold tracking-wide sm:text-sm", mode === m ? "bg-bambam-brown text-white" : "hover:bg-muted")}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {mode === "standard" ? (
          <section aria-label="Products" className="min-w-0 space-y-3">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="tablist" aria-label="Categories">
              {[{ id: "popular" as const, posLabel: "POPULAR", emoji: "🔥" }, ...CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === c.id}
                  onClick={() => setTab(c.id)}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center rounded-xl border text-[10px] font-bold tracking-wide sm:flex-row sm:gap-1.5 sm:text-sm",
                    tab === c.id ? "border-bambam-brown bg-bambam-brown text-white" : "bg-card hover:bg-muted",
                  )}
                >
                  <span aria-hidden className="text-lg">{c.emoji}</span> {c.posLabel}
                </button>
              ))}
            </div>
            {draft.isGroupOrder && (
              <p className="text-sm">Adding items for <strong className="text-bambam-red">{activeLabel}</strong></p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((p) => {
                const available = p.availability === "available";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => tapProduct(p)}
                    disabled={!available}
                    className="flex min-h-28 flex-col items-start justify-between rounded-xl border bg-card p-3 text-left shadow-xs transition hover:border-bambam-orange hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex w-full items-start justify-between">
                      <span className="text-3xl" aria-hidden>{p.emoji}</span>
                      {p.popular && tab !== "popular" && <Flame className="size-4 text-bambam-red" aria-label="Popular" />}
                    </span>
                    <span className="font-semibold leading-tight">{p.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {available ? peso(p.basePrice) : p.availability === "sold_out" ? "Sold out" : "Unavailable"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <QuickOrderPanel onConfirm={(r) => loadFromAi(r, false)} onEdit={(r) => loadFromAi(r, true)} />
        )}

        {lastOrder ? (
          <PosReceipt order={lastOrder} onNewOrder={() => { setLastOrder(null); draft.reset(); }} />
        ) : (
          <PosOrderPanel
            draft={draft}
            paymentKey={paymentKey}
            initialPaymentMethod={aiPayment}
            onEdit={(item) => {
              const product = products.find((p) => p.id === item.productId);
              if (product) setEditing({ kind: "edit", product, item });
            }}
            onDuplicate={duplicate}
            onConfirm={confirm}
          />
        )}
      </div>

      <CustomizeDialog
        product={editing?.product ?? null}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing && editing.kind !== "add" ? editing.item : undefined}
        mode={editing?.kind === "edit" ? "edit" : "add"}
        variant="pos"
        onConfirm={(item) => {
          if (editing?.kind === "edit") draft.updateItem(editing.item.lineId, item);
          else draft.addItem({ ...item, groupId: draft.activeGroupId });
        }}
      />
    </div>
  );
}
