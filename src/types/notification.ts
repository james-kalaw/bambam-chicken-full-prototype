// Notifications are role-specific. A new online order notifies the
// owner/cashier ("admin") but NOT the kitchen until it is accepted.

export type NotificationAudience = "admin" | "kitchen" | "customer";

export type NotificationTone = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  title: string;
  message: string;
  tone: NotificationTone;
  /** Order this notification is about, if any (used for "open order" links) */
  orderId?: string;
  /** Only for customer notifications: which customer should see it */
  customerId?: string;
  read: boolean;
  createdAt: string;
}
