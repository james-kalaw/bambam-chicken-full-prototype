import { ArrowRight, ChefHat, ClipboardCheck, LayoutDashboard, ShoppingBag, Smartphone, Tv, Wallet } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Mascot } from "@/components/shared/mascot";

// Pitch landing page: where the presenter starts the demo.

const VIEWS = [
  { href: "/customer", title: "Customer App", body: "Mobile-first ordering, OTP sign-in, order tracking and the Bambam chatbot.", icon: Smartphone, accent: true },
  { href: "/admin/orders", title: "Owner / Cashier", body: "Receive online orders, accept or decline, record payments.", icon: ClipboardCheck },
  { href: "/admin/kitchen", title: "Kitchen Display", body: "One clear queue: Confirmed → Preparing → Completed.", icon: ChefHat },
  { href: "/admin/pos", title: "POS", body: "Fast counter ordering for walk-in customers.", icon: ShoppingBag },
  { href: "/admin/dashboard", title: "Owner Dashboard", body: "Sales, orders, inventory and analytics in plain language.", icon: LayoutDashboard },
  { href: "/admin/cash", title: "Cash Drawer", body: "Opening cash, cash sales, refunds, expenses and the end-of-day count.", icon: Wallet },
  { href: "/now-serving", title: "Now Serving", body: "TV screen for the counter: Preparing and Completed numbers.", icon: Tv },
];

const SCRIPT = [
  { who: "Customer", steps: ["Open Bambam", "Browse the menu", "Customize Chicken Chops (Rice Meal)", "Cart → Pickup at 12:30 PM", "Cash at Pickup (or GCash → Pay Now + proof)", "Receive order number P-028"] },
  { who: "Owner", steps: ["New order notification appears", "Verify payment (if Pay Now)", "Open P-028 → Accept"] },
  { who: "Kitchen", steps: ["P-028 appears in the queue", "Start Preparing", "Mark Completed"] },
  { who: "Customer & counter", steps: ["Status updates → Completed", "Now Serving shows “Please claim”", "Cashier collects cash → change"] },
  { who: "Owner Dashboard", steps: ["Sales and order count go up", "Inventory is deducted", "Cash drawer updates"] },
];

const MORE_SCENARIOS = [
  "Walk-in group of 5, cash: POS → Group order: add person → Duplicate → Cash ₱1000 → change → D-052",
  "Walk-in GCash: POS → GCash → show QR → Mark payment verified",
  "Linked walk-in: POS → Link Customer → 0917 123 4567 → CUS-000428",
  "AI Quick Order: POS → AI QUICK ORDER → try the demo examples",
  "Restock: Inventory → Chicken → + Add Stock 5 kg → movement logged",
  "Waste: Inventory → Chicken → Record Spoilage 0.75 kg",
  "Bambam: tap the floating Bambam on any page — try it as Kitchen and ask about revenue",
];

export default function PitchHomePage() {
  return (
    <div className="min-h-dvh bg-bambam-cream">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex-1 space-y-4">
            <BrandLogo size="lg" priority />
            <p className="text-sm font-semibold tracking-wide text-bambam-red uppercase">Ordering · POS · Inventory · Business Management</p>
            <h1 className="font-display text-4xl leading-tight font-bold text-balance text-bambam-brown sm:text-5xl">
              One system for every Bambam order — from phone to kitchen to dashboard.
            </h1>
            <p className="max-w-2xl text-lg text-bambam-brown/80">
              A clickable prototype. All data is fictional demo data; nothing is connected to a real database, payment, SMS or AI service yet.
            </p>
          </div>
          <Mascot mood="happy" size="xl" priority />
        </header>

        <section aria-labelledby="views-title" className="mt-10">
          <h2 id="views-title" className="sr-only">Prototype views</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VIEWS.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className={`group flex flex-col gap-2 rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring ${v.accent ? "border-bambam-red bg-bambam-red text-white" : "bg-white"}`}
              >
                <v.icon className="size-6" aria-hidden />
                <span className="font-display text-lg font-semibold">{v.title}</span>
                <span className={`text-sm ${v.accent ? "text-white/90" : "text-muted-foreground"}`}>{v.body}</span>
                <ArrowRight className="mt-auto size-4 transition group-hover:translate-x-1" aria-hidden />
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-bambam-brown/70">
            Staff screens ask for a simulated sign-in first. Tip: open the customer app on a phone-sized window and the owner/kitchen screens in another window — they update each other live.
          </p>
        </section>

        <section aria-labelledby="script-title" className="mt-12 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 id="script-title" className="font-display text-2xl font-bold">Demo script</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SCRIPT.map((s, i) => (
              <li key={i} className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs font-bold tracking-wide text-bambam-red uppercase">Step {i + 1}</p>
                <p className="font-display text-lg font-semibold">{s.who}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {s.steps.map((step) => <li key={step}>• {step}</li>)}
                </ul>
              </li>
            ))}
          </ol>
          <h3 className="mt-8 font-display text-xl font-bold">More scenarios to show</h3>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {MORE_SCENARIOS.map((sc) => (
              <li key={sc} className="rounded-xl bg-muted/60 p-3">{sc}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
