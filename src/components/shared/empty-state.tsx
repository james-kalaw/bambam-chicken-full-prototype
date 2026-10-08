import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mascot, type MascotMood } from "./mascot";

interface EmptyStateProps {
  mood: MascotMood;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Mascot + message, used for empty lists, success screens and errors */
export function EmptyState({ mood, title, description, action, size = "md", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-10 text-center", className)}>
      <Mascot mood={mood} size={size} />
      <h3 className="mt-2 font-display text-xl font-semibold text-balance">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
