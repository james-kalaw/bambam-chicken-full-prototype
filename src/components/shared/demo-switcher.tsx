"use client";

import { ChefHat, ClipboardCheck, LayoutDashboard, MonitorSmartphone, Presentation, RotateCcw, ShoppingBag, Smartphone, Tv, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Pitch guide", icon: Presentation },
  { href: "/customer", label: "Customer app", icon: Smartphone },
  { href: "/admin/orders", label: "Owner · Orders", icon: ClipboardCheck },
  { href: "/admin/kitchen", label: "Kitchen display", icon: ChefHat },
  { href: "/admin/dashboard", label: "Owner dashboard", icon: LayoutDashboard },
  { href: "/admin/pos", label: "POS", icon: ShoppingBag },
  { href: "/admin/cash", label: "Cash drawer", icon: Wallet },
  { href: "/now-serving", label: "Now Serving screen", icon: Tv },
];

/** Floating helper for the presenter: jump between views and reset the demo. */
export function DemoSwitcher({ className }: { className?: string }) {
  const { resetDemo } = useDemoStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <Popover onOpenChange={() => setConfirming(false)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label="Demo views"
          className={cn("fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 z-40 size-10 rounded-full border-bambam-brown/20 bg-white/95 shadow-lg md:bottom-6 md:h-10 md:w-auto", className)}
        >
          <MonitorSmartphone /> <span className="hidden md:inline">Demo</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">
          Prototype views · tip: open the customer app and owner screens in two windows side by side
        </p>
        <nav aria-label="Demo views" className="grid">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
              <l.icon className="size-4 text-muted-foreground" aria-hidden /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 border-t pt-2">
          {confirming ? (
            <div className="space-y-2 px-1">
              <p className="text-xs">Reset all orders, inventory and notifications to the starting demo data?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    resetDemo();
                    setConfirming(false);
                    toast.success("Demo data reset");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setConfirming(true)}>
              <RotateCcw /> Reset demo data
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
