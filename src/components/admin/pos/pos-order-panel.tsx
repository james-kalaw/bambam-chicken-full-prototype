"use client";

import { AlertTriangle, Copy, Minus, MoreVertical, Pencil, Plus, StickyNote, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OrderTypeIcon } from "@/components/shared/badges";
import { peso } from "@/lib/format";
import { itemsSubtotal, lineTotal, missingRequiredOptions, ORDER_TYPE_LABELS, optionsSummary } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderItem, OrderType, PaymentMethod } from "@/types/order";
import { CustomerLinker } from "./customer-linker";
import { PosPaymentSection, type PosPaymentResult } from "./pos-payment";
import type { PosDraft } from "./use-pos-draft";

interface PosOrderPanelProps {
  draft: PosDraft;
  /** Changes when a new draft is loaded, so the payment section resets */
  paymentKey: string;
  initialPaymentMethod?: PaymentMethod;
  onEdit: (item: OrderItem) => void;
  onDuplicate: (item: OrderItem) => void;
  onConfirm: (payment: PosPaymentResult) => void;
}

function ItemRow({ item, draft, onEdit, onDuplicate }: { item: OrderItem; draft: PosDraft; onEdit: (i: OrderItem) => void; onDuplicate: (i: OrderItem) => void }) {
  const { products } = useDemoStore();
  const missing = missingRequiredOptions(item, products);
  return (
    <li className="py-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{item.productName}</p>
          {item.options.length > 0 && <p className="text-xs text-muted-foreground">{optionsSummary(item.options)}</p>}
          {item.note && <p className="text-xs text-muted-foreground italic">Note: {item.note}</p>}
          {missing.length > 0 && (
            <button type="button" onClick={() => onEdit(item)} className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-warning underline-offset-2 hover:underline">
              <AlertTriangle className="size-3.5" aria-hidden /> {missing.join(", ")} — tap to choose
            </button>
          )}
        </div>
        <span className="text-sm font-semibold tabular-nums">{peso(lineTotal(item))}</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label={`Decrease ${item.productName}`} onClick={() => draft.setQuantity(item.lineId, item.quantity - 1)}>
          {item.quantity === 1 ? <Trash2 /> : <Minus />}
        </Button>
        <span className="w-7 text-center font-semibold tabular-nums">{item.quantity}</span>
        <Button variant="outline" size="icon" aria-label={`Increase ${item.productName}`} onClick={() => draft.setQuantity(item.lineId, item.quantity + 1)}>
          <Plus />
        </Button>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => onDuplicate(item)} aria-label={`Duplicate ${item.productName}`}>
          <Copy /> Duplicate
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${item.productName}`}><MoreVertical /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(item)}><Pencil /> Edit options</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(item)}><StickyNote /> Add note</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => draft.removeItem(item.lineId)}><Trash2 /> Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function PosOrderPanel({ draft, paymentKey, initialPaymentMethod, onEdit, onDuplicate, onConfirm }: PosOrderPanelProps) {
  const { products } = useDemoStore();
  const total = itemsSubtotal(draft.items);
  const incomplete = draft.items.some((i) => missingRequiredOptions(i, products).length > 0);

  // In a group order, show items under each person
  const sections = draft.isGroupOrder
    ? draft.groups.map((g) => ({ group: g, items: draft.items.filter((i) => i.groupId === g.id) }))
    : [{ group: null, items: draft.items }];

  return (
    <aside id="pos-order" aria-label="Current order" className="flex h-fit flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Current order</h2>
        {draft.items.length > 0 && <Button variant="ghost" size="sm" onClick={draft.reset}>Clear</Button>}
      </div>

      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Order type">
        {(Object.keys(ORDER_TYPE_LABELS) as OrderType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={draft.orderType === t}
            onClick={() => draft.setOrderType(t)}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-semibold",
              draft.orderType === t ? "border-bambam-orange bg-accent" : "hover:bg-muted",
            )}
          >
            <OrderTypeIcon type={t} className="size-4" /> {ORDER_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <CustomerLinker customer={draft.customer} onChange={draft.setCustomer} />

      {/* People (group orders). Tap a person to add items to them. */}
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Add items for">
        {draft.isGroupOrder &&
          draft.groups.map((g) => {
            const count = draft.items.filter((i) => i.groupId === g.id).reduce((s, i) => s + i.quantity, 0);
            const active = draft.activeGroupId === g.id;
            return (
              <span key={g.id} className="inline-flex items-center">
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => draft.setActiveGroupId(g.id)}
                  className={cn("h-9 rounded-full border px-3 text-sm font-semibold", active ? "border-bambam-brown bg-bambam-brown text-white" : "bg-white hover:bg-muted")}
                >
                  {g.label} <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>({count})</span>
                </button>
                {count === 0 && (
                  <button type="button" onClick={() => draft.removePerson(g.id)} className="ml-0.5 rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label={`Remove ${g.label}`}>
                    <X className="size-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={draft.addPerson}>
          <UserPlus /> {draft.isGroupOrder ? "Add Person" : "Group order: add person"}
        </Button>
      </div>

      {draft.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Tap a product to start an order.</p>
      ) : (
        <div className="max-h-[42vh] overflow-y-auto pr-1">
          {sections.map(({ group, items }) => (
            <section key={group?.id ?? "all"} aria-label={group?.label}>
              {group && (
                <p className={cn("sticky top-0 z-10 mt-1 bg-card py-1 text-xs font-bold tracking-wide uppercase", draft.activeGroupId === group.id ? "text-bambam-red" : "text-muted-foreground")}>
                  {group.label}
                </p>
              )}
              {items.length === 0 ? (
                <p className="pb-2 text-xs text-muted-foreground">No items yet</p>
              ) : (
                <ul className="divide-y">
                  {items.map((item) => <ItemRow key={item.lineId} item={item} draft={draft} onEdit={onEdit} onDuplicate={onDuplicate} />)}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
        <span>Total</span>
        <span className="tabular-nums">{peso(total)}</span>
      </div>

      <PosPaymentSection
        key={paymentKey}
        total={total}
        initialMethod={initialPaymentMethod}
        blockedReason={draft.items.length === 0 ? undefined : incomplete ? "Some items still need options chosen." : undefined}
        onConfirm={onConfirm}
      />
    </aside>
  );
}
