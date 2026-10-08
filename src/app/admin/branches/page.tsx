"use client";

import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRANCHES } from "@/data/employees";
import { getTodayStats } from "@/lib/analytics";
import { number, peso } from "@/lib/format";
import { useDemoStore } from "@/lib/store";

const ACCESS = [
  { who: "Owner / Co-owner", scope: "All branches, consolidated analytics" },
  { who: "Branch Manager", scope: "Assigned branch only, unless granted more" },
  { who: "Cashier & Kitchen Staff", scope: "Assigned branch and role only" },
];

export default function BranchesPage() {
  const { orders, employees } = useDemoStore();
  const today = getTodayStats(orders);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-sm text-muted-foreground">New branches join the same platform: same menu tools, same reports.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {BRANCHES.map((b) => {
          const active = b.status === "active";
          return (
            <Card key={b.id} className={active ? "" : "border-dashed bg-muted/40 ring-0"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="size-4" aria-hidden /> {b.name}</CardTitle>
                <CardDescription className="flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {b.location}</CardDescription>
              </CardHeader>
              <CardContent>
                {active ? (
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Today&apos;s sales</dt><dd className="text-lg font-bold">{peso(today.revenue)}</dd></div>
                    <div><dt className="text-muted-foreground">Orders</dt><dd className="text-lg font-bold">{number(today.orders)}</dd></div>
                    <div><dt className="text-muted-foreground">Staff</dt><dd className="text-lg font-bold">{employees.filter((e) => e.branchId === b.id).length}</dd></div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">Planned. When it opens, its orders, inventory and staff will appear here and in the &quot;All Branches&quot; view.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Who sees which branch</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {ACCESS.map((a) => (
              <li key={a.who} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium">{a.who}</span>
                <span className="text-muted-foreground">{a.scope}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
