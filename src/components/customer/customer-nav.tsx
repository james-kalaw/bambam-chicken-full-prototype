"use client";

import { ClipboardList, Home, MessageCircle, ShoppingCart, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NotificationBell, useNotificationAlerts } from "@/components/shared/notifications";
import { itemCount } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

const NAV = [
  { href: "/customer", label: "Home", icon: Home },
  { href: "/customer/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/customer/orders", label: "Orders", icon: ClipboardList },
  { href: "/customer/ai", label: "Bambam", icon: MessageCircle },
  { href: "/customer/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string) {
  return href === "/customer" ? pathname === href : pathname.startsWith(href);
}

/** Customer notifications + toast alerts (order confirmed, completed, declined…) */
function useCustomerNotifications() {
  const router = useRouter();
  const { notifications, customerSession } = useDemoStore();
  const mine = notifications.filter((n) => n.audience === "customer" && n.customerId === customerSession?.customerId);

  const open = (n: AppNotification) => n.orderId && router.push(`/customer/orders/${n.orderId}`);
  const ringKey = useNotificationAlerts(mine, {
    moodFor: (n) => {
      if (n.tone === "error") return "disappointed";
      if (n.title.startsWith("Order completed")) return "approved";
      if (n.title.startsWith("Order confirmed")) return "excited";
      return "happy";
    },
    onOpen: open,
    scope: customerSession?.customerId ?? "guest",
  });
  return { mine, ringKey, open };
}

export function CustomerHeader() {
  const pathname = usePathname();
  const { cart, customerSession } = useDemoStore();
  const { mine, ringKey, open } = useCustomerNotifications();
  const count = itemCount(cart);

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-bambam-cream/95 backdrop-blur supports-[backdrop-filter]:bg-bambam-cream/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/customer" className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring" aria-label="Bambam Chicken home">
          <BrandLogo priority />
        </Link>

        {/* Desktop top navigation */}
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold text-bambam-brown/80 transition-colors hover:bg-white hover:text-bambam-brown",
                isActive(pathname, item.href) && "bg-white text-bambam-brown shadow-sm",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {customerSession && <NotificationBell notifications={mine} ringKey={ringKey} onSelect={open} />}
          <Button asChild variant="ghost" size="icon-lg" className="relative" aria-label={`Cart, ${count} items`}>
            <Link href="/customer/cart">
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-bambam-red px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {!customerSession && (
            <Button asChild size="sm" className="ml-1 hidden rounded-full sm:inline-flex">
              <Link href="/auth/customer">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Mobile bottom navigation */
export function CustomerBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground",
                  active && "text-bambam-red",
                )}
              >
                <item.icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
