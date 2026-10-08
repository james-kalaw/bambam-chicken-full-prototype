"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { peso } from "@/lib/format";
import { calcUnitPrice, makeId } from "@/lib/order-utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/order";
import type { OptionGroup, Product, SelectedOption } from "@/types/product";
import { ProductImage } from "./product-image";

/** groupId → selected choice ids */
type Selections = Record<string, string[]>;

function defaultSelections(product: Product, initial?: CartItem): Selections {
  const result: Selections = {};
  for (const group of product.optionGroups) {
    if (initial) {
      result[group.id] = initial.options.filter((o) => o.groupId === group.id).map((o) => o.choiceId);
    } else {
      // Pre-select the configured default (e.g. Regular size), otherwise the
      // first choice of required single groups, to save taps
      const preset = group.defaultChoiceId ?? (group.type === "single" && group.required ? group.choices[0].id : undefined);
      result[group.id] = preset ? [preset] : [];
    }
  }
  return result;
}

function toSelectedOptions(product: Product, selections: Selections): SelectedOption[] {
  return product.optionGroups.flatMap((group) =>
    group.choices
      .filter((c) => selections[group.id]?.includes(c.id))
      .map((c) => ({ groupId: group.id, groupLabel: group.label, choiceId: c.id, choiceLabel: c.label, priceDelta: c.priceDelta })),
  );
}

interface CustomizeDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: CartItem) => void;
  /** Pre-fills the form from an existing line */
  initial?: CartItem;
  /** "edit" updates `initial`; "add" creates a NEW line (e.g. Duplicate). Default: edit if `initial` is given. */
  mode?: "add" | "edit";
  /** "pos" hides the photo and notes for speed */
  variant?: "customer" | "pos";
}

export function CustomizeDialog(props: CustomizeDialogProps) {
  const { product, open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        {/* key resets the form whenever a different product/line is opened */}
        {product && <CustomizeForm key={`${product.id}-${props.initial?.lineId ?? "new"}-${props.mode ?? ""}`} {...props} product={product} />}
      </DialogContent>
    </Dialog>
  );
}

function CustomizeForm({ product, onConfirm, onOpenChange, initial, mode, variant = "customer" }: CustomizeDialogProps & { product: Product }) {
  const editing = (mode ?? (initial ? "edit" : "add")) === "edit";
  const [selections, setSelections] = useState<Selections>(() => defaultSelections(product, initial));
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [note, setNote] = useState(initial?.note ?? "");

  const options = toSelectedOptions(product, selections);
  const unitPrice = calcUnitPrice(product.basePrice, options);
  const missing = product.optionGroups.filter((g) => g.required && (selections[g.id]?.length ?? 0) === 0);

  function toggleMultiple(group: OptionGroup, choiceId: string, checked: boolean) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const next = checked ? [...current, choiceId] : current.filter((id) => id !== choiceId);
      return { ...prev, [group.id]: next };
    });
  }

  function confirm() {
    onConfirm({
      lineId: editing && initial ? initial.lineId : makeId("line"),
      productId: product.id,
      productName: product.name,
      emoji: product.emoji,
      unitPrice,
      quantity,
      options,
      note: note.trim() || undefined,
      groupId: initial?.groupId,
    });
    onOpenChange(false);
  }

  return (
    <>
      <div className="max-h-[calc(92dvh-5rem)] overflow-y-auto">
        {variant === "customer" && (
          <ProductImage emoji={product.emoji} image={product.image} name={product.name} size="lg" className="h-40 w-full" />
        )}
        <div className="space-y-5 p-5">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">{product.name}</DialogTitle>
            <DialogDescription>{product.description}</DialogDescription>
            <p className="text-sm font-semibold">Starts at {peso(product.basePrice)}</p>
          </DialogHeader>

          {product.optionGroups.map((group) => (
            <fieldset key={group.id} className="space-y-2">
              <legend className="mb-2 flex w-full items-center justify-between gap-2 text-sm font-semibold">
                <span>{group.label}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {group.required ? "Required" : group.maxSelect ? `Optional · up to ${group.maxSelect}` : "Optional"}
                </span>
              </legend>

              {group.type === "single" ? (
                <RadioGroup
                  value={selections[group.id]?.[0] ?? ""}
                  onValueChange={(v) => setSelections((prev) => ({ ...prev, [group.id]: [v] }))}
                  className="grid-cols-1 sm:grid-cols-2"
                >
                  {group.choices.map((choice) => {
                    const id = `${group.id}-${choice.id}`;
                    const active = selections[group.id]?.includes(choice.id);
                    return (
                      <Label
                        key={choice.id}
                        htmlFor={id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 font-medium transition-colors",
                          active ? "border-bambam-orange bg-accent" : "hover:bg-muted",
                        )}
                      >
                        <RadioGroupItem id={id} value={choice.id} />
                        <span className="flex-1">{choice.label}</span>
                        {choice.priceDelta > 0 && <span className="text-xs text-muted-foreground">+{peso(choice.priceDelta)}</span>}
                      </Label>
                    );
                  })}
                </RadioGroup>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.choices.map((choice) => {
                    const id = `${group.id}-${choice.id}`;
                    const checked = selections[group.id]?.includes(choice.id) ?? false;
                    const atMax = !!group.maxSelect && (selections[group.id]?.length ?? 0) >= group.maxSelect;
                    return (
                      <Label
                        key={choice.id}
                        htmlFor={id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 font-medium transition-colors",
                          checked ? "border-bambam-orange bg-accent" : "hover:bg-muted",
                          atMax && !checked && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          disabled={atMax && !checked}
                          onCheckedChange={(v) => toggleMultiple(group, choice.id, v === true)}
                        />
                        <span className="flex-1">{choice.label}</span>
                        <span className="text-xs text-muted-foreground">+{peso(choice.priceDelta)}</span>
                      </Label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          ))}

          <div className="space-y-2">
            <Label htmlFor="special-note" className="font-semibold">
              {variant === "pos" ? "Note for the kitchen" : "Special request"} <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="special-note"
              placeholder="e.g. Less sauce, please"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="m-0 flex-row items-center justify-between gap-3 rounded-none sm:justify-between">
        <div className="flex items-center gap-1 rounded-full border bg-background p-1" role="group" aria-label="Quantity">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={quantity <= 1}>
            <Minus />
          </Button>
          <span className="w-7 text-center font-semibold tabular-nums" aria-live="polite">{quantity}</span>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
            <Plus />
          </Button>
        </div>
        <Button size="lg" className="h-11 flex-1 text-base font-bold sm:flex-none sm:px-6" disabled={missing.length > 0} onClick={confirm}>
          {editing ? "UPDATE ITEM" : variant === "pos" ? "ADD TO ORDER" : "ADD TO CART"} · {peso(unitPrice * quantity)}
        </Button>
      </DialogFooter>
    </>
  );
}
