"use client";

import { ChevronDown, Gauge, Info, MinusCircle, Plus, Recycle, Search, SlidersHorizontal, Trash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryItemSheet } from "@/components/admin/inventory-item-sheet";
import { InventoryTable } from "@/components/admin/inventory-table";
import { StockActionDialog, type StockAction } from "@/components/admin/stock-action-dialog";
import { DemoBadge } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { productRecipes } from "@/data/inventory";
import { formatDateTime, qty } from "@/lib/format";
import { getStockStatus, STOCK_STATUS_LABELS } from "@/lib/inventory-utils";
import { canManageInventory, canViewFinancials } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { InventoryTransactionType, StockStatus } from "@/types/inventory";

const MOVEMENT_TYPES: InventoryTransactionType[] = [
  "Stock In", "Sale Usage", "Adjustment", "Waste", "Spoilage", "Complimentary Food", "Staff Meal", "Damaged", "Other Stock Out",
];

export default function InventoryPage() {
  const { inventory, inventoryLog, products } = useDemoStore();
  const employee = useCurrentEmployee();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StockStatus | "all">("all");
  const [movementType, setMovementType] = useState<InventoryTransactionType | "all">("all");
  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ action: StockAction; itemId?: string } | null>(null);

  const role = employee?.role ?? "kitchen";
  const canManage = canManageInventory(role);
  const filtered = inventory.filter(
    (i) => (status === "all" || getStockStatus(i) === status) && i.name.toLowerCase().includes(query.toLowerCase()),
  );
  const attention = inventory.filter((i) => getStockStatus(i) !== "healthy");
  const movements = inventoryLog.filter((t) => movementType === "all" || t.type === movementType).slice(0, 40);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Ingredient-based stock. Completed orders deduct ingredients automatically (demo recipes).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemoBadge>Units & quantities are placeholders</DemoBadge>
          {canManage && (
            <>
              <Button className="h-10 font-bold" onClick={() => setDialog({ action: "stock_in" })}><Plus /> ADD STOCK</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 font-bold">ACTIONS <ChevronDown /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDialog({ action: "adjust" })}><SlidersHorizontal /> Adjust Inventory</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog({ action: "waste" })}><Trash /> Record Waste</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog({ action: "spoilage" })}><Recycle /> Record Spoilage</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog({ action: "other_out" })}><MinusCircle /> Other Stock Out</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialog({ action: "threshold" })}><Gauge /> Set Low-Stock Threshold</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {attention.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-warning-soft p-3">
          <Mascot mood="surprised" size="sm" />
          <p className="text-sm">
            <strong>{attention.length} ingredients need attention:</strong>{" "}
            {attention.map((i) => `${i.name} (${STOCK_STATUS_LABELS[getStockStatus(i)]})`).join(", ")}
          </p>
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input type="search" placeholder="Search ingredients" aria-label="Search ingredients" className="h-10 bg-card pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as StockStatus | "all")}>
              <SelectTrigger className="h-10 bg-card" aria-label="Filter by status"><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(STOCK_STATUS_LABELS) as StockStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STOCK_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Tap an ingredient to see details{canManage ? ", add stock or record waste" : ""}.</p>
          <InventoryTable items={filtered} showCost={canViewFinancials(role)} onOpen={(i) => setSheetItemId(i.id)} />
        </TabsContent>

        <TabsContent value="movements" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Stock movements</CardTitle>
              <CardDescription>Stock doesn&apos;t only change because of sales — every in and out is recorded here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={movementType} onValueChange={(v) => setMovementType(v as InventoryTransactionType | "all")}>
                <SelectTrigger className="h-9 w-48" aria-label="Filter by movement type"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All movement types</SelectItem>
                  {MOVEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Type / reason</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Date / time</TableHead>
                      <TableHead>Related order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.itemName}</TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", t.change >= 0 ? "text-success" : "text-danger")}>
                          {t.change >= 0 ? "+" : "−"}{qty(Math.abs(t.change))} {t.unit}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{t.type}</span>
                          {t.note && <span className="ml-2 text-xs text-muted-foreground">{t.note}</span>}
                          {t.supplier && <span className="ml-2 text-xs text-muted-foreground">Supplier: {t.supplier}</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{t.by}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                        <TableCell className="font-semibold">{t.relatedOrder ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes" className="mt-3 space-y-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Info className="size-4" aria-hidden /> Each product is linked to the ingredients it uses. Quantities are demo values to be confirmed with Bambam.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(productRecipes).map(([productId, lines]) => {
              const product = products.find((p) => p.id === productId);
              return (
                <Card key={productId} size="sm">
                  <CardHeader><CardTitle>{product?.emoji} {product?.name}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {lines.map((l) => {
                        const ing = inventory.find((i) => i.id === l.ingredientId);
                        return (
                          <li key={l.ingredientId} className="flex justify-between">
                            <span>{ing?.name}</span>
                            <span className="text-muted-foreground tabular-nums">{qty(l.quantity)} {ing?.unit}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <InventoryItemSheet
        itemId={sheetItemId}
        canManage={canManage}
        onClose={() => setSheetItemId(null)}
        onAction={(action, itemId) => {
          setSheetItemId(null);
          setDialog({ action, itemId });
        }}
      />
      <StockActionDialog action={dialog?.action ?? null} itemId={dialog?.itemId} onClose={() => setDialog(null)} />
    </div>
  );
}
