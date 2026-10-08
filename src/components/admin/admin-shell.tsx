"use client";

import { LogOut, Menu, PauseCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BambamChatProvider, BambamLauncher, type BambamChatConfig } from "@/components/shared/bambam-chat";
import { RoleBadge } from "@/components/shared/badges";
import { BrandLogo } from "@/components/shared/brand-logo";
import { DemoSwitcher } from "@/components/shared/demo-switcher";
import { EmptyState } from "@/components/shared/empty-state";
import { MascotLoading } from "@/components/shared/mascot-loading";
import { NotificationBell, useNotificationAlerts } from "@/components/shared/notifications";
import { BRANCHES, DEMO_ACCOUNT_IDS } from "@/data/employees";
import { staffPrompts, staffReply } from "@/lib/chat-responder";
import { canAccess, homeModuleFor, ROLE_LABELS } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";
import type { Employee } from "@/types/people";
import { ADMIN_NAV, moduleFromPath } from "./admin-nav";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const employee = useCurrentEmployee();
  const { orders } = useDemoStore();
  if (!employee) return null;
  // Orders badge: online orders to accept + payments to verify
  const pending = orders.filter((o) => o.orderStatus === "pending_confirmation" || o.payment.status === "pending_verification").length;
  const inKitchen = orders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing").length;

  return (
    <nav aria-label="Admin" className="space-y-0.5">
      {ADMIN_NAV.filter((n) => canAccess(employee.role, n.module)).map((item) => {
        const href = `/admin/${item.module}`;
        const active = pathname.startsWith(href);
        const count = item.module === "orders" ? pending : item.module === "kitchen" ? inKitchen : 0;
        return (
          <Link
            key={item.module}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-accent font-semibold text-bambam-brown",
            )}
          >
            <item.icon className={cn("size-4.5", active && "text-bambam-red")} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className={cn("grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold", item.module === "orders" ? "bg-bambam-red text-white" : "bg-muted text-foreground")}>
                {count}
                <span className="sr-only">{item.module === "orders" ? " need your attention" : " in queue"}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** "View as" switcher so the owners can preview each role's interface */
function RoleSwitcher() {
  const { employees, signInAdmin } = useDemoStore();
  const employee = useCurrentEmployee();
  const router = useRouter();
  const pathname = usePathname();
  const accounts = employees.filter((e) => DEMO_ACCOUNT_IDS.includes(e.id));

  return (
    <Select
      value={employee?.id}
      onValueChange={(id) => {
        const next = employees.find((e) => e.id === id);
        signInAdmin(id);
        // Stay on the same page if the new role can see it
        const mod = moduleFromPath(pathname);
        if (next && mod && !canAccess(next.role, mod)) router.push(`/admin/${homeModuleFor(next.role)}`);
      }}
    >
      <SelectTrigger className="h-9 bg-white" aria-label="View as role">
        <span className="hidden text-xs text-muted-foreground lg:inline">View as:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {ROLE_LABELS[a.role]} · {a.name.split(" ")[0]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BranchSelector() {
  const { selectedBranch, setSelectedBranch } = useDemoStore();
  const employee = useCurrentEmployee();
  const isOwner = employee?.role === "owner" || employee?.role === "co_owner";
  // Managers and staff only see their assigned branch
  if (!isOwner) return <span className="hidden text-sm font-medium text-muted-foreground md:inline">{BRANCHES[0].name}</span>;

  return (
    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
      <SelectTrigger className="hidden h-9 bg-white md:flex" aria-label="Branch">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="all">All Branches</SelectItem>
        {BRANCHES.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}{b.status === "planned" ? " (planned)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Role-specific notifications with toast alerts */
function useAdminNotifications() {
  const router = useRouter();
  const employee = useCurrentEmployee();
  const { notifications } = useDemoStore();
  const audience = employee?.role === "kitchen" ? "kitchen" : "admin";
  const mine = notifications.filter((n) => n.audience === audience);

  const open = (n: AppNotification) => {
    if (audience === "kitchen") router.push("/admin/kitchen");
    else if (n.orderId) router.push(`/admin/orders?open=${n.orderId}`);
    else if (n.title.includes(":")) router.push("/admin/inventory");
  };
  const ringKey = useNotificationAlerts(mine, {
    moodFor: (n) => (audience === "admin" && (n.title === "New online order" || n.tone === "warning") ? "surprised" : null),
    onOpen: open,
    scope: audience,
  });
  return { mine, ringKey, open };
}

/** Staff-side Bambam: answers depend on the signed-in role (kitchen can't see revenue, etc.) */
function StaffBambam({ employee, children }: { employee: Employee; children: ReactNode }) {
  const store = useDemoStore();
  const config: BambamChatConfig = {
    scope: `staff:${employee.id}`,
    subtitle: `${ROLE_LABELS[employee.role]} assistant · demo data`,
    greeting: `Hi ${employee.name.split(" ")[0]}! What do you need help with?`,
    prompts: staffPrompts(employee.role),
    respond: (q) => staffReply(q, store, employee.role),
    variant: "admin",
  };
  return (
    <BambamChatProvider key={config.scope} config={config}>
      {children}
      <BambamLauncher hideOn={["/admin/ai"]} className="right-4 bottom-4" />
    </BambamChatProvider>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const employee = useCurrentEmployee();
  const { signOutAdmin, onlineOrderingOpen } = useDemoStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { mine, ringKey, open } = useAdminNotifications();

  // Admin pages require a (simulated) staff sign-in
  useEffect(() => {
    if (!employee) router.replace(`/auth/admin?next=${encodeURIComponent(pathname)}`);
  }, [employee, pathname, router]);

  if (!employee) return <MascotLoading label="Checking your staff session…" />;

  const mod = moduleFromPath(pathname);
  const allowed = !mod || canAccess(employee.role, mod);

  return (
    <StaffBambam employee={employee}>
      <div className="min-h-dvh bg-background">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
          <div className="flex h-16 items-center border-b px-4">
            <BrandLogo size="sm" subtitle="Business System" />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav />
          </div>
          <div className="border-t p-3 text-xs text-muted-foreground">
            Prototype · demo data only
          </div>
        </aside>

        <div className="lg:pl-60">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-white/95 px-3 backdrop-blur sm:px-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-3">
                <SheetTitle className="px-2 pt-2 pb-3"><BrandLogo size="sm" subtitle="Business System" /></SheetTitle>
                <SidebarNav onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <BranchSelector />
            {!onlineOrderingOpen && (
              <Link href="/admin/settings" className="hidden items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning sm:inline-flex">
                <PauseCircle className="size-3.5" aria-hidden /> Online orders paused
              </Link>
            )}

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <RoleSwitcher />
              <NotificationBell notifications={mine} ringKey={ringKey} onSelect={open} />
              <div className="hidden items-center gap-2 border-l pl-3 md:flex">
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold">{employee.name}</p>
                  <RoleBadge role={employee.role} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Sign out"
                onClick={() => {
                  signOutAdmin();
                  router.push("/auth/admin");
                }}
              >
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </header>

          {/* Bottom space keeps the floating Bambam button from covering the last button on a page */}
          <main id="main" className="mx-auto max-w-[1400px] p-4 pb-32 sm:p-6 sm:pb-32">
            {allowed ? (
              children
            ) : (
              <EmptyState
                mood="disappointed"
                title="This area isn't available for your role"
                description={`${ROLE_LABELS[employee.role]} accounts can't open this page. In the real system the server blocks it too, not just the menu.`}
                action={<Button asChild><Link href={`/admin/${homeModuleFor(employee.role)}`}>Go to my workspace</Link></Button>}
              />
            )}
          </main>
        </div>
        <DemoSwitcher className="bottom-4 md:bottom-4 lg:left-64" />
      </div>
    </StaffBambam>
  );
}
