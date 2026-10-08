"use client";

import { ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockBadge } from "@/components/shared/badges";
import { peso, qty, timeAgo } from "@/lib/format";
import { getStockStatus } from "@/lib/inventory-utils";
import type { InventoryItem } from "@/types/inventory";

interface InventoryTableProps {
  items: InventoryItem[];
  showCost: boolean;
  /** Opens the ingredient detail sheet */
  onOpen: (item: InventoryItem) => void;
}

export function InventoryTable({ items, showCost, onOpen }: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingredient</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="text-right">Current qty</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Low-stock at</TableHead>
            {showCost && <TableHead className="hidden text-right lg:table-cell">Unit cost</TableHead>}
            <TableHead className="hidden lg:table-cell">Last updated</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onOpen(item)}>
              <TableCell className="font-medium">
                {/* A real button so keyboard users can open the sheet too */}
                <button type="button" className="inline-flex items-center gap-1 text-left hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={(e) => { e.stopPropagation(); onOpen(item); }}>
                  {item.name} <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                </button>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{item.category}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{qty(item.quantity)} {item.unit}</TableCell>
              <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">{qty(item.lowStockThreshold)} {item.unit}</TableCell>
              {showCost && <TableCell className="hidden text-right tabular-nums lg:table-cell">{peso(item.unitCost)}/{item.unit}</TableCell>}
              <TableCell className="hidden text-muted-foreground lg:table-cell">{timeAgo(item.lastUpdated)}</TableCell>
              <TableCell><StockBadge status={getStockStatus(item)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
