"use client";

import { ArrowDownRight, ArrowUpRight, Banknote, Calculator, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarList, ColumnChart, TwoLineChart } from "@/components/admin/charts";
import { DemoBadge } from "@/components/shared/badges";
import { ChartCard } from "@/components/shared/chart-card";
import { Mascot } from "@/components/shared/mascot";
import { MetricCard } from "@/components/shared/metric-card";
import {
  type AnalyticsPeriod, CUSTOMER_STATS, DEMO_COST_RATIO, HOURLY_ORDERS, INVENTORY_LOSSES, LAST_7_DAYS_REVENUE,
  MONTH_COMPARISON, MONTH_WEEKLY_REVENUE, MONTHLY_REVENUE_TREND, PERIOD_BASELINE, WEEKLY_WASTE,
} from "@/data/analytics";
import { getTodayStats } from "@/lib/analytics";
import { isToday } from "@/lib/order-utils";
import type { Order } from "@/types/order";
import { number, peso, pesoCompact, percent } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderType, PaymentMethod } from "@/types/order";

/** Channel and customer-identity counts for today's live demo orders */
function getLiveOrderSplits(orders: Order[]) {
  const todays = orders.filter((o) => isToday(o.createdAt) && o.orderStatus !== "declined");
  return {
    online: todays.filter((o) => o.channel === "online").length,
    walkIn: todays.filter((o) => o.channel === "walk_in").length,
    known: todays.filter((o) => o.customerId).length,
    guest: todays.filter((o) => !o.customerId).length,
  };
}

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

/** Demo multipliers to turn today's product units into week/month numbers */
const PRODUCT_SCALE: Record<AnalyticsPeriod, number> = { today: 1, week: 6.8, month: 17.3 };

function changePct(prev: number, curr: number) {
  return ((curr - prev) / prev) * 100;
}

export default function AnalyticsPage() {
  const { orders } = useDemoStore();
  const [period, setPeriod] = useState<AnalyticsPeriod>("today");
  const today = getTodayStats(orders);

  // Period totals = baseline demo data + live demo orders from today
  // Week/month = demo baseline + today's live demo orders
  const live = getLiveOrderSplits(orders);
  const totals =
    period === "today"
      ? today
      : {
          ...PERIOD_BASELINE[period],
          revenue: PERIOD_BASELINE[period].revenue + today.liveRevenue,
          cashRevenue: PERIOD_BASELINE[period].cashRevenue + today.liveCashRevenue,
          electronicRevenue: PERIOD_BASELINE[period].electronicRevenue + today.liveElectronicRevenue,
          orders: PERIOD_BASELINE[period].orders + today.liveOrders,
          online: PERIOD_BASELINE[period].online + live.online,
          walkIn: PERIOD_BASELINE[period].walkIn + live.walkIn,
          knownCustomerOrders: PERIOD_BASELINE[period].knownCustomerOrders + live.known,
          guestOrders: PERIOD_BASELINE[period].guestOrders + live.guest,
        };
  const aov = totals.revenue / totals.orders;
  const estCost = totals.revenue * DEMO_COST_RATIO;

  const trend =
    period === "today"
      ? { data: HOURLY_ORDERS.map((h) => ({ x: h.hour, y: h.orders })), label: "Orders", format: (n: number) => String(n), title: "Orders by hour" }
      : period === "week"
        ? { data: LAST_7_DAYS_REVENUE.map((v, i) => ({ x: i === 6 ? "Today" : `Day ${i + 1}`, y: i === 6 ? today.revenue : v })), label: "Sales", format: pesoCompact, title: "Sales by day" }
        : { data: MONTH_WEEKLY_REVENUE.map((w) => ({ x: w.label, y: w.revenue })), label: "Sales", format: pesoCompact, title: "Sales by week" };

  const topProducts = today.topProducts.slice(0, 6).map((p) => ({ label: p.name, value: Math.round(p.units * PRODUCT_SCALE[period]) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Simple numbers that answer: how are we doing, and is it getting better?</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemoBadge />
          <div className="inline-flex rounded-lg border bg-card p-0.5" role="radiogroup" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={period === p.id}
                onClick={() => setPeriod(p.id)}
                className={cn("h-8 rounded-md px-3 text-sm font-medium", period === p.id ? "bg-bambam-brown text-white" : "hover:bg-muted")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            {["Overview", "Sales", "Products", "Inventory", "Customers", "Growth"].map((t) => (
              <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Key numbers">
            <MetricCard label="Revenue (completed sales)" value={peso(totals.revenue)} icon={Banknote} />
            <MetricCard label="Orders" value={number(totals.orders)} icon={Receipt} />
            <MetricCard label="Average order value" value={peso(Math.round(aov * 100) / 100)} icon={ShoppingBag} />
            <MetricCard label="Estimated cost" value={peso(Math.round(estCost))} icon={Calculator} hint="Demo ratio — not real costs" />
            <MetricCard label="Est. gross profit" value={peso(Math.round(totals.revenue - estCost))} icon={TrendingUp} hint="Demo/mock estimate" />
          </section>
          <Card>
            <CardContent className="flex items-start gap-4">
              <Mascot mood="thinking" size="md" className="hidden sm:block" />
              <div className="space-y-2">
                <h2 className="font-semibold">In plain words</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>Sales increased {changePct(MONTH_COMPARISON[0].previous, MONTH_COMPARISON[0].current).toFixed(1)}% compared with last month.</li>
                  <li>{today.topProducts[0]?.name} remained the best-selling product.</li>
                  <li>Lunch (11 AM – 1 PM) is the busiest time, following school breaks.</li>
                  <li>Inventory waste decreased by {Math.abs(changePct(MONTH_COMPARISON[3].previous, MONTH_COMPARISON[3].current)).toFixed(1)}%.</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  True profit needs confirmed ingredient, supplier, salary, rent, utilities and other costs. Until then, profit figures are estimates on demo data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sales ── */}
        <TabsContent value="sales" className="mt-4 grid gap-4 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-3"
            title={trend.title}
            table={{ headers: ["Period", trend.label], rows: trend.data.map((d) => [d.x, trend.format(d.y)]) }}
          >
            <ColumnChart data={trend.data} xKey="x" yKey="y" valueLabel={trend.label} format={trend.format} highlight={period === "week" ? (d) => d.x === "Today" : undefined} />
          </ChartCard>
          <Card>
            <CardHeader><CardTitle>Orders by type</CardTitle></CardHeader>
            <CardContent>
              <BarList format={number} items={(Object.keys(totals.byType) as OrderType[]).map((t) => ({ label: ORDER_TYPE_LABELS[t], value: totals.byType[t] }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Orders by payment method</CardTitle></CardHeader>
            <CardContent>
              <BarList format={number} items={(Object.keys(totals.byPayment) as PaymentMethod[]).map((m) => ({ label: PAYMENT_METHOD_LABELS[m], value: totals.byPayment[m] }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Order channel</CardTitle><CardDescription>Where orders came from</CardDescription></CardHeader>
            <CardContent>
              <BarList format={number} items={[{ label: "Walk-in", value: totals.walkIn }, { label: "Online", value: totals.online }]} />
              <p className="mt-3 text-sm text-muted-foreground">{percent(totals.online / (totals.online + totals.walkIn), 0)} of orders came online.</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Revenue by payment</CardTitle>
              <CardDescription>Completed sales split by how they were paid. The cash drawer is tracked separately on the Cash Drawer page.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList format={peso} items={[{ label: "Cash", value: totals.cashRevenue }, { label: "Electronic (GCash, Maya, bank…)", value: totals.electronicRevenue }]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Products ── */}
        <TabsContent value="products" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top products</CardTitle>
              <CardDescription>Units sold · {PERIODS.find((p) => p.id === period)?.label}</CardDescription>
            </CardHeader>
            <CardContent><BarList format={number} items={topProducts} /></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Popular with repeat customers</CardTitle>
              <CardDescription>Share of repeat-customer orders that include the item</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList format={(n) => `${n}%`} items={CUSTOMER_STATS.repeatFavorites.map((r) => ({ label: r.product, value: Math.round(r.share * 100) }))} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory ── */}
        <TabsContent value="inventory" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock lost outside of sales</CardTitle>
              <CardDescription>This month, estimated value (demo)</CardDescription>
            </CardHeader>
            <CardContent><BarList format={peso} items={INVENTORY_LOSSES.map((l) => ({ label: l.reason, value: l.value }))} /></CardContent>
          </Card>
          <ChartCard title="Waste by week" description="Going down is good" table={{ headers: ["Week", "Waste"], rows: WEEKLY_WASTE.map((w) => [w.week, peso(w.value)]) }}>
            <ColumnChart data={WEEKLY_WASTE} xKey="week" yKey="value" valueLabel="Waste" format={pesoCompact} />
          </ChartCard>
        </TabsContent>

        {/* ── Customers ── */}
        <TabsContent value="customers" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="New vs returning customers"
            description="Customers per week this month"
            table={{ headers: ["Week", "New", "Returning"], rows: CUSTOMER_STATS.weekly.map((w) => [w.week, w.new, w.returning]) }}
          >
            <TwoLineChart data={CUSTOMER_STATS.weekly} xKey="week" series={[{ key: "returning", label: "Returning" }, { key: "new", label: "New" }]} format={(n) => String(n)} />
          </ChartCard>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Known customers vs guest transactions</CardTitle>
              <CardDescription>
                Orders linked to a customer ID vs guest walk-ins · {PERIODS.find((p) => p.id === period)?.label}. Guest transactions are
                not unique people — one student can be many guest transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarList format={number} items={[{ label: "Known-customer orders", value: totals.knownCustomerOrders }, { label: "Guest transactions", value: totals.guestOrders }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer groups</CardTitle>
              <CardDescription>Simple rule-based groups (advanced segmentation later)</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList format={number} items={CUSTOMER_STATS.segments.map((s) => ({ label: s.segment, value: s.count }))} />
              <p className="mt-3 text-sm text-muted-foreground">
                On average, customers order {CUSTOMER_STATS.avgOrdersPerCustomer} times and spend {peso(CUSTOMER_STATS.avgSpendPerCustomer)}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Growth ── */}
        <TabsContent value="growth" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Last month vs this month</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Last month</TableHead>
                    <TableHead className="text-right">This month</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MONTH_COMPARISON.map((row) => {
                    const pct = changePct(row.previous, row.current);
                    const good = row.goodWhen === "up" ? pct > 0 : pct < 0;
                    const fmt = row.format === "currency" ? pesoCompact : number;
                    const Icon = pct >= 0 ? ArrowUpRight : ArrowDownRight;
                    return (
                      <TableRow key={row.metric}>
                        <TableCell className="font-medium">{row.metric}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.format === "currency" && row.current < 1000 ? peso(row.previous) : fmt(row.previous)}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.format === "currency" && row.current < 1000 ? peso(row.current) : fmt(row.current)}</TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", good ? "text-success" : "text-danger")}>
                          <span className="inline-flex items-center gap-0.5">
                            <Icon className="size-4" aria-hidden />
                            {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                            <span className="sr-only">{good ? "(improved)" : "(worse)"}</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                <li>Sales increased compared with last month.</li>
                <li>Chicken Chops remained the best-selling product.</li>
                <li>Inventory waste decreased.</li>
              </ul>
            </CardContent>
          </Card>
          <ChartCard
            title="Monthly sales"
            description="Last 6 months"
            table={{ headers: ["Month", "Sales"], rows: MONTHLY_REVENUE_TREND.map((m) => [m.month, peso(m.revenue)]) }}
          >
            <ColumnChart data={MONTHLY_REVENUE_TREND} xKey="month" yKey="revenue" valueLabel="Sales" format={pesoCompact} highlight={(m) => m.month === MONTHLY_REVENUE_TREND.at(-1)?.month} />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
