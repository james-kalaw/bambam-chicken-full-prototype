"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaymentBadge } from "@/components/shared/badges";
import { PaymentProofUpload, PaymentQr, type ProofValue } from "@/components/shared/payment-panels";
import { paymentMethodText } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import type { Order } from "@/types/order";

/** Payment box on the customer's order page — kept separate from the order status */
export function CustomerPaymentCard({ order }: { order: Order }) {
  const { submitPaymentProof } = useDemoStore();
  const [proof, setProof] = useState<ProofValue>({ imageUrl: null, reference: "" });
  const p = order.payment;
  const canResubmit = p.method !== "cash" && (p.status === "payment_issue" || (p.status === "unpaid" && p.timing === "pay_now")) && order.orderStatus !== "declined";

  const message = (() => {
    if (p.status === "paid") return "Payment received. Thank you!";
    if (p.status === "refunded") return "This order was refunded.";
    if (p.status === "pending_verification") return "Payment submitted for verification. Bambam will confirm it shortly.";
    if (p.status === "payment_issue") return `There's a problem with your payment: ${p.issueNote ?? "please check with Bambam"}. You can send a new proof below or pay at the counter.`;
    if (order.channel === "walk_in") return "Pay at the counter.";
    return order.orderType === "delivery" ? "Pay when you receive your order." : "Pay at the counter when you claim your order.";
  })();

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Payment</p>
      <div className="flex flex-wrap items-center gap-2">
        <PaymentBadge status={p.status} />
        <span className="text-sm font-semibold">{paymentMethodText(order)}</span>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">{message}</p>
      <dl className="grid grid-cols-1 gap-1 text-xs">
        <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono">{p.id}</dd></div>
        {p.providerReference && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Your reference no.</dt><dd className="font-mono">{p.providerReference}</dd></div>}
      </dl>

      {canResubmit && (
        <div className="space-y-3 border-t pt-3">
          <PaymentQr method={p.method} amount={order.total} />
          <PaymentProofUpload value={proof} onChange={setProof} />
          <Button
            className="h-11 w-full rounded-full font-bold"
            disabled={!proof.imageUrl}
            onClick={() => {
              if (!proof.imageUrl) return;
              submitPaymentProof(order.id, { proofImageUrl: proof.imageUrl, providerReference: proof.reference.trim() || undefined, submittedAmount: order.total });
              setProof({ imageUrl: null, reference: "" });
              toast.success("Payment submitted for verification.");
            }}
          >
            SUBMIT PAYMENT
          </Button>
        </div>
      )}
    </div>
  );
}
