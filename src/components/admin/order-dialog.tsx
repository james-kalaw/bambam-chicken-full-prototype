"use client";

import { AlertTriangle, ArrowLeft, Banknote, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ChannelBadge, OrderTypeBadge, PaymentBadge, StatusBadge } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { CollectPaymentForm, PaymentVerificationCard } from "@/components/shared/payment-panels";
import { formatDateTime, formatTime, maskMobile, peso } from "@/lib/format";
import { itemsByGroup, optionsSummary, paymentMethodText } from "@/lib/order-utils";
import { canHandlePayments, canManageOrders } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import type { DeclineReason, Order } from "@/types/order";

const DECLINE_REASONS: DeclineReason[] = [
  "Item unavailable",
  "Unable to accommodate requested time",
  "Store temporarily at capacity",
  "Other",
];

type View = "details" | "decline" | "accepted" | "declined" | "refund" | "collect";

/**
 * Order details for owner/cashier. For online orders waiting for confirmation
 * this is the "NEW ONLINE ORDER — Accept / Decline" screen.
 */
export function OrderDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {orderId && <OrderDialogBody key={orderId} orderId={orderId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

/** Order ID, Queue Number, Payment ID and Customer ID are four different things */
function IdentifierList({ order }: { order: Order }) {
  const rows = [
    ["Order ID", order.id],
    ["Queue number", order.queueNumber],
    ["Payment ID", order.payment.id],
    ["Customer ID", order.customerId ?? "Guest (none)"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-muted/50 p-3 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-mono font-semibold break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Payment details for an order that is already paid (or refunded) */
function PaidSummary({ order }: { order: Order }) {
  const p = order.payment;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
      <div><dt className="text-xs text-muted-foreground">Amount paid</dt><dd className="font-semibold tabular-nums">{peso(p.amountPaid ?? order.total)}</dd></div>
      {p.paidAt && <div><dt className="text-xs text-muted-foreground">Paid at</dt><dd>{formatTime(p.paidAt)}</dd></div>}
      {p.cashReceived !== undefined && (
        <>
          <div><dt className="text-xs text-muted-foreground">Cash received</dt><dd className="tabular-nums">{peso(p.cashReceived)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Change given</dt><dd className="tabular-nums">{peso(p.changeGiven ?? 0)}</dd></div>
        </>
      )}
      {p.providerReference && <div><dt className="text-xs text-muted-foreground">Provider reference</dt><dd className="font-mono text-xs">{p.providerReference}</dd></div>}
      {p.verifiedBy && <div><dt className="text-xs text-muted-foreground">Verified by</dt><dd>{p.verifiedBy}</dd></div>}
    </dl>
  );
}

function OrderDialogBody({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { orders, acceptOrder, declineOrder, refundPayment } = useDemoStore();
  const employee = useCurrentEmployee();
  const order = orders.find((o) => o.id === orderId);
  const [view, setView] = useState<View>("details");
  const [reason, setReason] = useState<DeclineReason>("Item unavailable");
  const [otherReason, setOtherReason] = useState("");

  if (!order) return <DialogTitle>Order not found</DialogTitle>;
  const canManage = employee ? canManageOrders(employee.role) : false;
  const canPay = employee ? canHandlePayments(employee.role) : false;
  const pending = order.orderStatus === "pending_confirmation";
  const p = order.payment;

  if (view === "accepted" || view === "declined") {
    const accepted = view === "accepted";
    return (
      <div className="space-y-2 py-4 text-center" role="status">
        <Mascot mood={accepted ? "approved" : "disappointed"} size="lg" className="mx-auto" />
        <DialogTitle className="text-2xl font-bold">{accepted ? "Order accepted." : "Order declined."}</DialogTitle>
        <DialogDescription>
          {accepted ? `${order.queueNumber} was sent to the kitchen. The customer has been notified.` : `The customer was notified: ${order.declineReason}.`}
        </DialogDescription>
        <Button className="mt-4" onClick={onClose}>Done</Button>
      </div>
    );
  }

  if (view === "collect") {
    return (
      <>
        <DialogHeader>
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setView("details")}><ArrowLeft /> Back</Button>
          <DialogTitle className="text-xl font-bold">Collect payment · {order.queueNumber}</DialogTitle>
          <DialogDescription>Customer chose {paymentMethodText(order)}. They can still pay another way.</DialogDescription>
        </DialogHeader>
        <CollectPaymentForm order={order} onDone={() => setView("details")} />
      </>
    );
  }

  if (view === "decline") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Decline {order.queueNumber}?</DialogTitle>
          <DialogDescription>The customer will receive this reason.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={(v) => setReason(v as DeclineReason)}>
          {DECLINE_REASONS.map((r) => (
            <Label key={r} htmlFor={`r-${r}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 font-normal hover:bg-muted">
              <RadioGroupItem id={`r-${r}`} value={r} /> {r}
            </Label>
          ))}
        </RadioGroup>
        {reason === "Other" && (
          <Textarea aria-label="Other reason" placeholder="Type the reason" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setView("details")}>Back</Button>
          <Button
            variant="destructive"
            disabled={reason === "Other" && !otherReason.trim()}
            onClick={() => {
              declineOrder(order.id, reason === "Other" ? otherReason.trim() : reason);
              setView("declined");
            }}
          >
            Decline order
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (view === "refund") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Refund {order.queueNumber}?</DialogTitle>
          <DialogDescription>
            This marks {peso(order.total)} as refunded and is recorded in the audit log
            {p.method === "cash" ? " and the cash drawer" : ""}. In the real system this sensitive action will ask you to re-enter your password.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setView("details")}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              refundPayment(order.id);
              toast.success(`${order.queueNumber} marked as refunded`);
              setView("details");
            }}
          >
            Confirm refund
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        {pending && (
          <div className="flex items-center gap-3 rounded-xl bg-warning-soft p-3">
            <Mascot mood="surprised" size="sm" />
            <div>
              <p className="text-xs font-bold tracking-wide text-warning uppercase">New online order</p>
              <p className="text-sm">Review this order before confirming.</p>
            </div>
          </div>
        )}
        <DialogTitle className="text-3xl font-bold tracking-tight">{order.queueNumber}</DialogTitle>
        <DialogDescription>Placed {formatDateTime(order.createdAt)}{order.customerName ? ` · ${order.customerName}` : " · Guest"}</DialogDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <ChannelBadge channel={order.channel} size="lg" />
          <OrderTypeBadge type={order.orderType} size="lg" />
          <StatusBadge status={order.orderStatus} size="lg" />
        </div>
      </DialogHeader>

      <IdentifierList order={order} />

      {/* Items, grouped per person for group orders */}
      <div className="divide-y rounded-lg border text-sm">
        {itemsByGroup(order).map((section) => (
          <div key={section.label ?? "all"}>
            {section.label && <p className="bg-muted/50 px-3 py-1.5 text-xs font-bold tracking-wide uppercase">{section.label}</p>}
            <ul className="divide-y">
              {section.items.map((item) => (
                <li key={item.lineId} className="flex justify-between gap-3 p-3">
                  <span>
                    <span className="font-semibold">{item.quantity} × {item.productName}</span>
                    {item.options.length > 0 && <span className="block text-xs text-muted-foreground">{optionsSummary(item.options)}</span>}
                    {item.note && <span className="block text-xs text-muted-foreground italic">Note: {item.note}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{peso(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex justify-between p-3 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{peso(order.total)}</span>
        </div>
      </div>

      {order.scheduledTime && <p className="text-sm"><span className="text-muted-foreground">Pickup:</span> <strong>{order.scheduledTime}</strong></p>}

      {order.delivery && (
        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="font-semibold">Delivery · {order.delivery.name} · {maskMobile(order.delivery.mobile)}</p>
          <p>{order.delivery.address}</p>
          {order.delivery.landmark && <p className="text-muted-foreground">Landmark: {order.delivery.landmark}</p>}
          {order.delivery.instructions && <p className="text-muted-foreground">“{order.delivery.instructions}”</p>}
          <p className="mt-1 text-xs text-warning">Delivery is arranged manually by Bambam.</p>
        </div>
      )}
      {order.declineReason && <p className="text-sm text-danger">Declined: {order.declineReason}</p>}

      {/* Payment — separate from the order status */}
      <section aria-label="Payment" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold">Payment</h3>
          <PaymentBadge status={p.status} />
          <span className="text-sm text-muted-foreground">{paymentMethodText(order)}</span>
        </div>
        {p.status === "pending_verification" && canPay && <PaymentVerificationCard order={order} compact />}
        {(p.status === "paid" || p.status === "refunded") && <PaidSummary order={order} />}
        {p.status === "payment_issue" && (
          <p className="flex items-center gap-1.5 text-sm text-danger"><AlertTriangle className="size-4" aria-hidden /> {p.issueNote ?? "Payment issue"} — waiting for the customer, or collect payment in person.</p>
        )}
        {canPay && (p.status === "unpaid" || p.status === "payment_issue") && order.orderStatus !== "declined" && (
          <Button variant="outline" className="w-full" onClick={() => setView("collect")}>
            <Banknote /> Collect payment
          </Button>
        )}
        {canPay && p.status === "paid" && (
          <Button variant="ghost" size="sm" onClick={() => setView("refund")}>Refund…</Button>
        )}
      </section>

      {canManage && pending && (
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {p.status === "pending_verification" && (
            <p className="text-xs text-muted-foreground">Tip: verify the payment above before accepting a Pay Now order.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" variant="outline" className="h-12 text-base font-bold" onClick={() => setView("decline")}>
              <X /> DECLINE
            </Button>
            <Button
              size="lg"
              className="h-12 bg-success text-base font-bold text-white hover:bg-success/90"
              onClick={() => {
                acceptOrder(order.id);
                setView("accepted");
              }}
            >
              <Check /> ACCEPT
            </Button>
          </div>
        </DialogFooter>
      )}
    </>
  );
}
