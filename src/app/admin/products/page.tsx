"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvailabilityBadge } from "@/components/shared/badges";
import { CATEGORIES } from "@/data/products";
import { peso } from "@/lib/format";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import type { Product, ProductAvailability } from "@/types/product";

function PriceCell({ product, canEdit }: { product: Product; canEdit: boolean }) {
  const { setProductPrice } = useDemoStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.basePrice));

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-semibold tabular-nums">{peso(product.basePrice)}</span>
        {canEdit && (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit price of ${product.name}`} onClick={() => { setValue(String(product.basePrice)); setEditing(true); }}>
            <Pencil />
          </Button>
        )}
      </span>
    );
  }
  const price = Number(value);
  return (
    <form
      className="inline-flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(price > 0)) return;
        setProductPrice(product.id, price);
        setEditing(false);
        toast.success(`${product.name} price saved and logged`);
      }}
    >
      <Input aria-label="New price" inputMode="numeric" className="h-8 w-20" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))} autoFocus />
      <Button type="submit" size="icon-sm" aria-label="Save price" disabled={!(price > 0)}><Check /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditing(false)}><X /></Button>
    </form>
  );
}

export default function ProductsPage() {
  const { products, setProductAvailability } = useDemoStore();
  const employee = useCurrentEmployee();
  const isOwner = employee?.role === "owner" || employee?.role === "co_owner";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">Changes appear on the customer menu and POS instantly.</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <Switch id="auto-soldout" disabled aria-describedby="auto-soldout-desc" />
        <div>
          <Label htmlFor="auto-soldout" className="font-semibold">Automatically mark items sold out when ingredients run out</Label>
          <p id="auto-soldout-desc" className="text-sm text-muted-foreground">Future feature — the owner decides whether to turn this on. For now, availability is set manually below.</p>
        </div>
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} aria-labelledby={`cat-${cat.id}`} className="space-y-2">
          <h2 id={`cat-${cat.id}`} className="font-semibold">{cat.emoji} {cat.label}</h2>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Options</TableHead>
                  <TableHead>Base price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Set availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.filter((p) => p.category === cat.id).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {p.optionGroups.length ? p.optionGroups.map((g) => g.label.replace("Choose ", "")).join(", ") : "—"}
                    </TableCell>
                    <TableCell><PriceCell product={p} canEdit={isOwner} /></TableCell>
                    <TableCell><AvailabilityBadge availability={p.availability} /></TableCell>
                    <TableCell>
                      <Select value={p.availability} onValueChange={(v) => setProductAvailability(p.id, v as ProductAvailability)}>
                        <SelectTrigger className="h-9 w-36" aria-label={`Availability of ${p.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                          <SelectItem value="sold_out">Sold Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
      {!isOwner && <p className="text-sm text-muted-foreground">Only Owner accounts can change prices.</p>}
    </div>
  );
}
