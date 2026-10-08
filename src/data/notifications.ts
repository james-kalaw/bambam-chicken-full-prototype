import type { AppNotification } from "@/types/notification";
import type { Order } from "@/types/order";

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export function createNotifications(orders: Order[]): AppNotification[] {
  const idOf = (queue: string) => orders.find((o) => o.queueNumber === queue)?.id;
  return [
    {
      id: "ntf-1",
      audience: "admin",
      title: "New online order",
      message: "DL-005 · Delivery · 3 items — waiting for confirmation",
      tone: "info",
      orderId: idOf("DL-005"),
      read: false,
      createdAt: minsAgo(3),
    },
    {
      id: "ntf-1b",
      audience: "admin",
      title: "Payment to verify",
      message: "DL-005 · GCash · ₱358 — proof of payment submitted",
      tone: "info",
      orderId: idOf("DL-005"),
      read: false,
      createdAt: minsAgo(3),
    },
    {
      id: "ntf-2",
      audience: "admin",
      title: "Low stock",
      message: "Coffee Beans are below the low-stock threshold.",
      tone: "warning",
      read: true,
      createdAt: minsAgo(70),
    },
    {
      id: "ntf-3",
      audience: "kitchen",
      title: "New order to prepare",
      message: "T-051 · Walk-in · Takeout · 1 item",
      tone: "info",
      orderId: idOf("T-051"),
      read: false,
      createdAt: minsAgo(2),
    },
    {
      id: "ntf-4",
      audience: "customer",
      customerId: "CUS-000428",
      title: "Order completed",
      message: "P-019 is complete. Enjoy your Bambam!",
      tone: "success",
      orderId: idOf("P-019"),
      read: true,
      createdAt: minsAgo(60 * 48),
    },
  ];
}
