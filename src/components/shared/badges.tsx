import {
  AlertTriangle, Ban, Banknote, Bike, CheckCircle2, ChefHat, CircleDashed, Clock, Globe, Hourglass,
  PackageCheck, RotateCcw, ShoppingBag, Store, UserRound, Utensils, XCircle, type LucideIcon,
} from "lucide-react";
import { STOCK_STATUS_LABELS } from "@/lib/inventory-utils";
import { CHANNEL_LABELS, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-utils";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types/inventory";
import type { OrderChannel, OrderStatus, OrderType, PaymentStatus } from "@/types/order";
import type { StaffRole } from "@/types/people";
import type { ProductAvailability } from "@/types/product";

// Every badge shows an icon AND text, so status never relies on color alone.

const tones = {
  neutral: "bg-muted text-foreground border-border",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  warning: "bg-warning-soft text-warning border-amber-200",
  success: "bg-success-soft text-success border-green-200",
  danger: "bg-danger-soft text-danger border-red-200",
  brand: "bg-bambam-cream text-bambam-brown border-amber-200",
  dark: "bg-bambam-brown text-white border-bambam-brown",
} as const;

type Tone = keyof typeof tones;

function Pill({ tone, icon: Icon, children, className, size = "sm" }: {
  tone: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string; size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </span>
  );
}

const orderStatusStyle: Record<OrderStatus, { tone: Tone; icon: LucideIcon }> = {
  pending_confirmation: { tone: "warning", icon: Hourglass },
  confirmed: { tone: "info", icon: CheckCircle2 },
  preparing: { tone: "brand", icon: ChefHat },
  completed: { tone: "success", icon: PackageCheck },
  declined: { tone: "danger", icon: XCircle },
};

export function StatusBadge({ status, size, className }: { status: OrderStatus; size?: "sm" | "lg"; className?: string }) {
  const s = orderStatusStyle[status];
  return (
    <Pill tone={s.tone} icon={s.icon} size={size} className={className}>
      {status === "pending_confirmation" ? "Needs confirmation" : ORDER_STATUS_LABELS[status]}
    </Pill>
  );
}

const paymentStyle: Record<PaymentStatus, { tone: Tone; icon: LucideIcon }> = {
  unpaid: { tone: "neutral", icon: Banknote },
  pending_verification: { tone: "warning", icon: Clock },
  paid: { tone: "success", icon: CheckCircle2 },
  payment_issue: { tone: "danger", icon: AlertTriangle },
  refunded: { tone: "danger", icon: RotateCcw },
};

export function PaymentBadge({ status, size, className }: { status: PaymentStatus; size?: "sm" | "lg"; className?: string }) {
  const s = paymentStyle[status];
  return (
    <Pill tone={s.tone} icon={s.icon} size={size} className={className}>
      {PAYMENT_STATUS_LABELS[status]}
    </Pill>
  );
}

const orderTypeIcons: Record<OrderType, LucideIcon> = {
  dine_in: Utensils,
  takeout: ShoppingBag,
  pickup: Store,
  delivery: Bike,
};

export function OrderTypeBadge({ type, size, className }: { type: OrderType; size?: "sm" | "lg"; className?: string }) {
  return (
    <Pill tone="neutral" icon={orderTypeIcons[type]} size={size} className={className}>
      {ORDER_TYPE_LABELS[type]}
    </Pill>
  );
}

/** Where the order came from. Shown next to the order type: "Walk-in · Dine-In" */
export function ChannelBadge({ channel, size, className }: { channel: OrderChannel; size?: "sm" | "lg"; className?: string }) {
  return (
    <Pill tone={channel === "online" ? "info" : "brand"} icon={channel === "online" ? Globe : Store} size={size} className={className}>
      {CHANNEL_LABELS[channel]}
    </Pill>
  );
}

/** Known customer (with ID) or anonymous guest */
export function CustomerBadge({ customerId, name, className }: { customerId?: string; name?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <UserRound className="size-3.5 text-muted-foreground" aria-hidden />
      {customerId ? (
        <>
          <span className="font-medium">{name}</span>
          <span className="font-mono text-muted-foreground">{customerId}</span>
        </>
      ) : (
        <span className="text-muted-foreground">Guest</span>
      )}
    </span>
  );
}

export function OrderTypeIcon({ type, className }: { type: OrderType; className?: string }) {
  const Icon = orderTypeIcons[type];
  return <Icon aria-hidden className={className} />;
}

const roleTone: Record<StaffRole, Tone> = {
  owner: "dark",
  co_owner: "dark",
  manager: "brand",
  cashier: "info",
  kitchen: "neutral",
};

export function RoleBadge({ role, className }: { role: StaffRole; className?: string }) {
  return (
    <Pill tone={roleTone[role]} className={className}>
      {ROLE_LABELS[role]}
    </Pill>
  );
}

const stockStyle: Record<StockStatus, { tone: Tone; icon: LucideIcon }> = {
  healthy: { tone: "success", icon: CheckCircle2 },
  low: { tone: "warning", icon: AlertTriangle },
  critical: { tone: "danger", icon: AlertTriangle },
  out: { tone: "danger", icon: Ban },
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const s = stockStyle[status];
  return (
    <Pill tone={s.tone} icon={s.icon} className={className}>
      {STOCK_STATUS_LABELS[status]}
    </Pill>
  );
}

const availabilityStyle: Record<ProductAvailability, { tone: Tone; icon: LucideIcon; label: string }> = {
  available: { tone: "success", icon: CheckCircle2, label: "Available" },
  unavailable: { tone: "neutral", icon: CircleDashed, label: "Unavailable" },
  sold_out: { tone: "danger", icon: Ban, label: "Sold Out" },
};

export function AvailabilityBadge({ availability, className }: { availability: ProductAvailability; className?: string }) {
  const s = availabilityStyle[availability];
  return (
    <Pill tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Pill>
  );
}

export function DemoBadge({ className, children = "Demo data" }: { className?: string; children?: React.ReactNode }) {
  return (
    <Pill tone="brand" className={cn("border-dashed", className)}>
      {children}
    </Pill>
  );
}
