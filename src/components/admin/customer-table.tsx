import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, maskMobile, peso } from "@/lib/format";
import type { Customer, CustomerSegment } from "@/types/people";

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  new: "New",
  returning: "Returning",
  frequent: "Frequent",
  high_value: "High Value",
  inactive: "Inactive",
};

/**
 * Customer directory: KNOWN customers only (guest walk-ins never appear).
 * Phone numbers are always masked here.
 */
export function CustomerTable({ customers, showSpend }: { customers: Customer[]; showSpend: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Phone</TableHead>
            <TableHead className="hidden text-right md:table-cell">Online</TableHead>
            <TableHead className="hidden text-right md:table-cell">Linked walk-in</TableHead>
            <TableHead className="text-right">Total orders</TableHead>
            {showSpend && <TableHead className="text-right">Lifetime spend</TableHead>}
            <TableHead className="hidden md:table-cell">Last order</TableHead>
            <TableHead className="hidden lg:table-cell">Favorite</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">{c.id}</TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell">{maskMobile(c.mobile)}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{c.onlineOrders}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{c.walkInOrders}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{c.onlineOrders + c.walkInOrders}</TableCell>
              {showSpend && <TableCell className="text-right tabular-nums">{peso(c.lifetimeSpend)}</TableCell>}
              <TableCell className="hidden text-muted-foreground md:table-cell">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{c.favoriteProduct ?? "—"}</TableCell>
              <TableCell>
                <span className="rounded-full border bg-muted px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{SEGMENT_LABELS[c.segment]}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
