import {
  BarChart3, Bot, Boxes, Building2, ChefHat, ClipboardList, LayoutDashboard, Package, Wallet,
  ScrollText, Settings, ShoppingBag, UserCog, Users, type LucideIcon,
} from "lucide-react";
import type { AdminModule } from "@/lib/permissions";

export const ADMIN_NAV: { module: AdminModule; label: string; icon: LucideIcon }[] = [
  { module: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { module: "pos", label: "POS", icon: ShoppingBag },
  { module: "orders", label: "Orders", icon: ClipboardList },
  { module: "cash", label: "Cash Drawer", icon: Wallet },
  { module: "kitchen", label: "Kitchen", icon: ChefHat },
  { module: "inventory", label: "Inventory", icon: Boxes },
  { module: "products", label: "Products", icon: Package },
  { module: "customers", label: "Customers", icon: Users },
  { module: "analytics", label: "Analytics", icon: BarChart3 },
  { module: "employees", label: "Employees", icon: UserCog },
  { module: "branches", label: "Branches", icon: Building2 },
  { module: "ai", label: "AI Assistant", icon: Bot },
  { module: "audit-logs", label: "Audit Logs", icon: ScrollText },
  { module: "settings", label: "Settings", icon: Settings },
];

/** "/admin/audit-logs/..." → "audit-logs" */
export function moduleFromPath(pathname: string): AdminModule | null {
  const segment = pathname.split("/")[2];
  return ADMIN_NAV.find((n) => n.module === segment)?.module ?? null;
}
