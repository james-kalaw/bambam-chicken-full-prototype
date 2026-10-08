"use client";

import { Bell, BellRing, CheckCheck, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { timeAgo } from "@/lib/format";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";
import { Mascot, type MascotMood } from "./mascot";

const toneDot: Record<AppNotification["tone"], string> = {
  info: "bg-sky-600",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-danger",
};

export function NotificationItem({ notification, onSelect }: { notification: AppNotification; onSelect?: (n: AppNotification) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
        !notification.read && "bg-accent/70",
      )}
    >
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneDot[notification.tone])} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">{notification.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{notification.message}</span>
        {!notification.read && <span className="sr-only">(unread)</span>}
      </span>
    </button>
  );
}

interface NotificationBellProps {
  notifications: AppNotification[];
  onSelect?: (n: AppNotification) => void;
  /** Changes whenever a new notification arrives, to replay the bell animation */
  ringKey?: number;
  className?: string;
}

/** Bell with unread count. Opens a drawer listing notifications. */
export function NotificationBell({ notifications, onSelect, ringKey = 0, className }: NotificationBellProps) {
  const { markAllRead, markNotificationRead } = useDemoStore();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={cn("relative", className)}
          aria-label={`Notifications, ${unread.length} unread`}
        >
          <span key={ringKey} className={cn("grid place-items-center", ringKey > 0 && "animate-bell")}>
            {unread.length > 0 ? <BellRing className="size-5" /> : <Bell className="size-5" />}
          </span>
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-bambam-red px-1 text-[11px] font-bold text-white">
              {unread.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>{unread.length} unread</SheetDescription>
        </SheetHeader>
        <div className="flex items-center justify-end px-4 pt-2">
          <Button variant="ghost" size="sm" disabled={unread.length === 0} onClick={() => markAllRead(unread.map((n) => n.id))}>
            <CheckCheck /> Mark all as read
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onSelect={(item) => {
                  markNotificationRead(item.id);
                  setOpen(false);
                  onSelect?.(item);
                }}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Watches a list of notifications and shows a toast for each NEW one
 * (including ones created in another browser tab). Returns a counter that
 * increases on each new arrival, used to ring the bell.
 */
export function useNotificationAlerts(
  notifications: AppNotification[],
  options: {
    moodFor?: (n: AppNotification) => MascotMood | null;
    onOpen?: (n: AppNotification) => void;
    /** When this changes (e.g. role switch), existing notifications are treated as already seen */
    scope?: string;
  } = {},
): number {
  const seen = useRef<Set<string> | null>(null);
  const seenScope = useRef(options.scope);
  const [ringKey, setRingKey] = useState(0);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    // First run: remember what already exists, don't toast old notifications
    if (seen.current === null || seenScope.current !== options.scope) {
      seenScope.current = options.scope;
      seen.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const fresh = notifications.filter((n) => !seen.current!.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seen.current!.add(n.id));
    setRingKey((k) => k + 1);

    for (const n of fresh.slice(0, 3)) {
      const mood = optionsRef.current.moodFor?.(n) ?? null;
      toast.custom(
        (id) => (
          <div className="flex w-[min(92vw,380px)] items-center gap-3 rounded-xl border bg-popover p-3 shadow-lg">
            {mood && <Mascot mood={mood} size="sm" />}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {n.title}
                {/* Visual "sound" indicator — no real audio in the prototype */}
                <Volume2 className="size-3.5 animate-pulse text-bambam-orange" aria-label="Alert chime" />
              </p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
            {n.orderId && optionsRef.current.onOpen && (
              <Button
                size="sm"
                onClick={() => {
                  optionsRef.current.onOpen?.(n);
                  toast.dismiss(id);
                }}
              >
                Open
              </Button>
            )}
          </div>
        ),
        { duration: 7000 },
      );
    }
  }, [notifications, options.scope]);

  return ringKey;
}
