import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Small line under the value, e.g. "+2 from live demo orders" */
  hint?: string;
  /** Highlights the card when something needs attention (e.g. low stock) */
  tone?: "default" | "warning";
  /** Hide the value for roles that cannot see financial data */
  restricted?: boolean;
}

export function MetricCard({ label, value, icon: Icon, hint, tone = "default", restricted }: MetricCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-1 transition-shadow",
        tone === "warning" && "ring-amber-300 bg-warning-soft/40",
      )}
    >
      <CardContent className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {restricted ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Lock className="size-3.5" aria-hidden /> Restricted for your role
            </p>
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          )}
          {hint && !restricted && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            tone === "warning" ? "bg-warning-soft text-warning" : "bg-accent text-bambam-brown",
          )}
          aria-hidden
        >
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}
