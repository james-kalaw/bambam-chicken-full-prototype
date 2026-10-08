"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDialog } from "@/components/admin/order-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PaymentVerificationCard } from "@/components/shared/payment-panels";
import { CHANNEL_LABELS, ORDER_TYPE_LABELS } from "@/lib/order-utils";
import { canEditBusinessData, canHandlePayments } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order, OrderChannel, OrderType } from "@/types/order";

interface TabDef {
  id: string;
  label: string;
  match: (o: Order) => boolean;
  empty: string;
}

const TABS: TabDef[] = [
  { id: "pending", label: "Needs confirmation", match: (o) => o.orderStatus === "pending_confirmation", empty: "No online orders waiting. You're all caught up!" },
  { id: "payments", label: "Payments to verify", match: (o) => o.payment.status === "pending_verification", empty: "No payments waiting for verification." },
  { id: "active", label: "In progress", match: (o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing", empty: "No orders in the kitchen right now." },
  { id: "completed", label: "Completed", match: (o) => o.orderStatus === "completed", empty: "No completed orders yet." },
  { id: "declined", label: "Declined", match: (o) => o.orderStatus === "declined", empty: "No declined orders." },
];

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const { orders, onlineOrderingOpen, setOnlineOrdering } = useDemoStore();
  const employee = useCurrentEmployee();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState("pending");
  const [channel, setChannel] = useState<OrderChannel | "all">("all");
  const [type, setType] = useState<OrderType | "all">("all");
  const canPay = employee ? canHandlePayments(employee.role) : false;

  // ?open=<orderId> comes from notification links
  const openId = params.get("open");
  const setOpen = (order: Order | null) =>
    router.replace(order ? `/admin/orders?open=${order.id}` : "/admin/orders", { scroll: false });

  const filtered = orders.filter((o) => (channel === "all" || o.channel === channel) && (type === "all" || o.orderType === type));
  const tabs = TABS.filter((t) => t.id !== "payments" || canPay);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Online orders must be accepted here before they reach the kitchen. Walk-in orders go straight in.</p>
        </div>
        {employee && canEditBusinessData(employee.role) && (
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <Switch id="online-ordering" checked={onlineOrderingOpen} onCheckedChange={setOnlineOrdering} />
            <Label htmlFor="online-ordering" className="text-sm">
              Online ordering: <span className={onlineOrderingOpen ? "text-success" : "text-warning"}>{onlineOrderingOpen ? "Accepting" : "Paused"}</span>
            </Label>
          </div>
        )}
      </div>

      {/* Filters: channel (where the order came from) + order type (how it's received) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-card p-0.5" role="radiogroup" aria-label="Channel">
          {(["all", "online", "walk_in"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={channel === c}
              onClick={() => setChannel(c)}
              className={cn("h-8 rounded-md px-3 text-sm font-medium", channel === c ? "bg-bambam-brown text-white" : "hover:bg-muted")}
            >
              {c === "all" ? "All" : CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <Select value={type} onValueChange={(v) => setType(v as OrderType | "all")}>
          <SelectTrigger className="h-9 bg-card" aria-label="Order type"><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All order types</SelectItem>
            {(Object.keys(ORDER_TYPE_LABELS) as OrderType[]).map((t) => <SelectItem key={t} value={t}>{ORDER_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        {(channel !== "all" || type !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setChannel("all"); setType("all"); }}>Clear filters</Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-10">
            {tabs.map((t) => {
              const count = filtered.filter(t.match).length;
              const urgent = (t.id === "pending" || t.id === "payments") && count > 0;
              return (
                <TabsTrigger key={t.id} value={t.id} className="px-3">
                  {t.label}
                  <span className={urgent ? "rounded-full bg-bambam-red px-1.5 text-xs font-bold text-white" : "text-xs text-muted-foreground"}>{count}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        {tabs.map((t) => {
          const list = filtered.filter(t.match);
          return (
            <TabsContent key={t.id} value={t.id} className="mt-3">
              {list.length === 0 ? (
                <EmptyState mood="happy" size="sm" title={t.empty} />
              ) : t.id === "payments" ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((o) => (
                    <div key={o.id} className="space-y-1">
                      <PaymentVerificationCard order={o} />
                      <Button variant="link" size="sm" onClick={() => setOpen(o)}>Open order {o.queueNumber}</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((o) => <OrderCard key={o.id} order={o} onOpen={setOpen} />)}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <OrderDialog orderId={openId} onClose={() => setOpen(null)} />
    </div>
  );
}
