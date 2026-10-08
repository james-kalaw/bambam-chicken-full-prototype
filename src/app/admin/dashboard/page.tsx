"use client";

import { AlertTriangle, Banknote, BadgeCheck, Boxes, CreditCard, Globe, Receipt, ShoppingBag, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList, ColumnChart } from "@/components/admin/charts";
import { DemoBadge, OrderTypeBadge, PaymentBadge, StatusBadge, StockBadge } from "@/components/shared/badges";
import { ChartCard } from "@/components/shared/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Mascot } from "@/components/shared/mascot";
import { MetricCard } from "@/components/shared/metric-card";
import { HOURLY_ORDERS, LAST_7_DAYS_REVENUE } from "@/data/analytics";
import { BRANCHES } from "@/data/employees";
import { getTodayStats } from "@/lib/analytics";
import { number, peso, pesoCompact, timeAgo } from "@/lib/format";
import { getStockStatus } from "@/lib/inventory-utils";
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import { canViewFinancials } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import type { OrderType, PaymentMethod } from "@/types/order";

function lastSevenDayLabels(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return i === 6 ? "Today" : d.toLocaleDateString("en-PH", { weekday: "short" });
  });
}

export default function DashboardPage() {
  const { orders, inventory, selectedBranch } = useDemoStore();
  const employee = useCurrentEmployee();
  const financial = employee ? canViewFinancials(employee.role) : false;
  const branch = BRANCHES.find((b) => b.id === selectedBranch);

  if (branch?.status === "planned") {
    return (
      <EmptyState
        mood="thinking"
        title={`${branch.name} isn't open yet`}
        description="When a new branch opens, it uses this same platform. The owner sees every branch here; managers only see their own."
      />
    );
  }

  const stats = getTodayStats(orders);
  const lowStock = inventory.filter((i) => getStockStatus(i) !== "healthy");
  const recentOnline = orders.filter((o) => o.channel === "online").slice(0, 5);

  const labels = lastSevenDayLabels();
  const weekData = LAST_7_DAYS_REVENUE.map((rev, i) => ({
    day: labels[i],
    revenue: i === 6 ? stats.revenue : rev,
  }));

  const liveHint = stats.liveOrders > 0 ? `incl. ${stats.liveOrders} live demo order${stats.liveOrders === 1 ? "" : "s"}` : undefined;
  // Note: revenue counts COMPLETED orders. Guest walk-ins count fully — no customer ID needed.

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good day, {employee?.name.split(" ")[0]}!</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranch === "all" ? "All branches" : branch?.name} · Today, {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <DemoBadge>Demo data — fictional numbers</DemoBadge>
      </div>

      {stats.pending > 0 && (
        <Link
          href="/admin/orders"
          className="flex items-center gap-3 rounded-xl border border-amber-300 bg-warning-soft p-3 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Mascot mood="surprised" size="sm" />
          <div className="flex-1">
            <p className="font-semibold">{stats.pending} online order{stats.pending === 1 ? "" : "s"} waiting for your confirmation</p>
            <p className="text-sm text-muted-foreground">They won&apos;t reach the kitchen until accepted.</p>
          </div>
          <Button size="sm" asChild><span>Review</span></Button>
        </Link>
      )}

      {stats.paymentsToVerify > 0 && (
        <Link
          href="/admin/orders"
          className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
        >
          <BadgeCheck className="size-6 shrink-0 text-sky-800" aria-hidden />
          <p className="flex-1 font-semibold">{stats.paymentsToVerify} online payment{stats.paymentsToVerify === 1 ? "" : "s"} waiting for verification</p>
          <Button size="sm" variant="outline" asChild><span>Verify</span></Button>
        </Link>
      )}

      {/* Money: revenue (completed sales) split by how it was paid. The cash drawer is separate. */}
      <section aria-label="Today's sales" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Today's Sales (revenue)" value={peso(stats.revenue)} icon={Banknote} restricted={!financial} hint={liveHint ?? "Completed orders"} />
        <MetricCard label="Cash Sales" value={peso(stats.cashRevenue)} icon={Wallet} restricted={!financial} hint="Paid in cash · drawer is separate" />
        <MetricCard label="Electronic Sales" value={peso(stats.electronicRevenue)} icon={CreditCard} restricted={!financial} hint="GCash, Maya, bank" />
        <MetricCard label="Average Order Value" value={peso(Math.round(stats.aov * 100) / 100)} icon={ShoppingBag} restricted={!financial} />
      </section>
      <section aria-label="Today's orders" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Today's Orders" value={number(stats.orders)} icon={Receipt} hint={liveHint} />
        <MetricCard label="Walk-In Orders" value={number(stats.walkIn)} icon={Store} hint={`${number(stats.guestOrders)} guest transactions today`} />
        <MetricCard label="Online Orders" value={number(stats.online)} icon={Globe} />
        <MetricCard label="Low Stock Items" value={String(lowStock.length)} icon={Boxes} tone={lowStock.length > 0 ? "warning" : "default"} hint="Below threshold" />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {financial ? (
          <ChartCard
            className="xl:col-span-2"
            title="Sales, last 7 days"
            description="Completed sales per day. Today updates live."
            table={{ headers: ["Day", "Sales"], rows: weekData.map((d) => [d.day, peso(d.revenue)]) }}
          >
            <ColumnChart data={weekData} xKey="day" yKey="revenue" valueLabel="Sales" format={pesoCompact} highlight={(d) => d.day === "Today"} />
          </ChartCard>
        ) : (
          <Card className="xl:col-span-2">
            <CardContent>
              <EmptyState mood="thinking" size="sm" title="Sales charts are hidden for your role" description="Whether managers can see financial data is still to be decided by the owners." />
            </CardContent>
          </Card>
        )}
        <ChartCard
          title="Peak order hours"
          description="Orders per hour today"
          table={{ headers: ["Hour", "Orders"], rows: HOURLY_ORDERS.map((h) => [h.hour, h.orders]) }}
        >
          <ColumnChart data={HOURLY_ORDERS} xKey="hour" yKey="orders" valueLabel="Orders" format={(n) => String(n)} />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Orders by type</CardTitle>
            <CardDescription>Today</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              format={number}
              items={(Object.keys(stats.byType) as OrderType[]).map((t) => ({ label: ORDER_TYPE_LABELS[t], value: stats.byType[t] }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>Number of orders today</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              format={number}
              items={(Object.keys(stats.byPayment) as PaymentMethod[]).map((m) => ({ label: PAYMENT_METHOD_LABELS[m], value: stats.byPayment[m] }))}
            />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Units sold today</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList format={number} items={stats.topProducts.slice(0, 5).map((p) => ({ label: p.name, value: p.units }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" aria-hidden /> Inventory warnings</CardTitle>
            <CardDescription>Ingredients below their configured thresholds</CardDescription>
            <CardAction><Button variant="outline" size="sm" asChild><Link href="/admin/inventory">Inventory</Link></Button></CardAction>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All ingredients are healthy.</p>
            ) : (
              <ul className="divide-y">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-medium">{i.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">{Number(i.quantity.toFixed(2))} {i.unit}</span>
                      <StockBadge status={getStockStatus(i)} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent online orders</CardTitle>
            <CardDescription>Newest first</CardDescription>
            <CardAction><Button variant="outline" size="sm" asChild><Link href="/admin/orders">All orders</Link></Button></CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentOnline.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex flex-wrap items-center gap-2 py-2 text-sm hover:bg-muted/50">
                    <span className="w-16 font-bold">{o.queueNumber}</span>
                    <OrderTypeBadge type={o.orderType} />
                    <PaymentBadge status={o.payment.status} />
                    <StatusBadge status={o.orderStatus} />
                    <span className="ml-auto text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
                    {financial && <span className="w-16 text-right font-semibold tabular-nums">{peso(o.total)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
