"use client";

import { Repeat, Search, UserPlus, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CustomerTable } from "@/components/admin/customer-table";
import { DemoBadge } from "@/components/shared/badges";
import { MetricCard } from "@/components/shared/metric-card";
import { CUSTOMER_STATS } from "@/data/analytics";
import { number, peso, percent } from "@/lib/format";
import { canViewFinancials } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";

export default function CustomersPage() {
  const { customers } = useDemoStore();
  const employee = useCurrentEmployee();
  const [query, setQuery] = useState("");
  const showSpend = employee ? canViewFinancials(employee.role) : false;

  const q = query.toLowerCase();
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Known customers only — each has a unique ID linking online orders and linked walk-in orders. Guest walk-ins are never added here.
          </p>
        </div>
        <DemoBadge>Fictional customers</DemoBadge>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Customer summary">
        <MetricCard label="Total customers" value={number(CUSTOMER_STATS.totalCustomers)} icon={Users} />
        <MetricCard label="New this month" value={number(CUSTOMER_STATS.newThisMonth)} icon={UserPlus} />
        <MetricCard label="Returning rate" value={percent(CUSTOMER_STATS.returningRate, 0)} icon={Repeat} />
        <MetricCard label="Avg. spend per customer" value={peso(CUSTOMER_STATS.avgSpendPerCustomer)} icon={Wallet} restricted={!showSpend} />
      </section>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" placeholder="Search name or ID" aria-label="Search customers" className="h-10 bg-card pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <CustomerTable customers={filtered} showSpend={showSpend} />
      <p className="text-xs text-muted-foreground">Phone numbers are masked. Full contact details are only shown where needed (e.g. delivery orders).</p>
    </div>
  );
}
