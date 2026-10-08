"use client";

import { Gift, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CurrentOrderCard } from "@/components/customer/current-order-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Mascot } from "@/components/shared/mascot";
import { formatDate, maskMobile, peso } from "@/lib/format";
import { useDemoStore } from "@/lib/store";

export default function ProfilePage() {
  const { customerSession, customers, signOutCustomer } = useDemoStore();

  if (!customerSession) {
    return (
      <EmptyState
        mood="happy"
        title="Welcome to My Bambam"
        description="Sign in to see your orders, favorites and future rewards."
        action={<Button asChild className="rounded-full"><Link href="/auth/customer?next=/customer/profile">Sign in with mobile</Link></Button>}
      />
    );
  }

  const customer = customers.find((c) => c.id === customerSession.customerId);
  if (!customer) return null;

  const stats = [
    { label: "Orders", value: `${customer.onlineOrders + customer.walkInOrders}`, hint: `${customer.onlineOrders} online · ${customer.walkInOrders} in-store` },
    { label: "Total spent", value: peso(customer.lifetimeSpend) },
    { label: "Favorite", value: customer.favoriteProduct ?? "—" },
    { label: "Favorite flavor", value: customer.favoriteFlavor ?? "—" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
        <Mascot mood="happy" size="md" />
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-bambam-red uppercase">My Bambam</p>
          <h1 className="font-display text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{customer.id}</span> · {maskMobile(customer.mobile)}
          </p>
          <p className="text-xs text-muted-foreground">Member since {formatDate(customer.joinedAt)}</p>
        </div>
      </section>

      <section aria-label="Your stats" className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-xl leading-tight font-bold">{s.value}</p>
            {"hint" in s && <p className="text-xs text-muted-foreground">{s.hint}</p>}
          </div>
        ))}
      </section>

      <CurrentOrderCard />

      {/* Loyalty preview — earning rules are NOT decided yet */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-dashed border-bambam-orange/60 bg-bambam-yellow/50 p-5">
        <div className="flex items-start gap-4">
          <Mascot mood="excited" size="sm" />
          <div className="flex-1 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-bambam-red uppercase">
              <Gift className="size-3.5" aria-hidden /> Bam Rewards · Coming soon
            </p>
            <p className="font-display text-3xl font-bold text-bambam-brown">{customer.loyaltyPoints ?? 0} points</p>
            <Progress value={86} aria-label="Progress to next reward (preview)" className="h-2.5 bg-white" />
            <p className="text-sm text-bambam-brown/80">
              Preview only. How points are earned and redeemed will be decided by the Bambam owners.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Account & security</h2>
        <p className="flex items-center gap-2 text-sm">
          <Smartphone className="size-4 text-muted-foreground" aria-hidden />
          {customerSession.trustedDevice ? "Signed in on this trusted device" : "Signed in for this session only"}
        </p>
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden /> Sign-in with mobile number + one-time code
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline" className="rounded-full"><Link href="/customer/orders">Order history</Link></Button>
          <Button variant="ghost" className="rounded-full text-danger hover:text-danger" onClick={signOutCustomer}>
            <LogOut /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
