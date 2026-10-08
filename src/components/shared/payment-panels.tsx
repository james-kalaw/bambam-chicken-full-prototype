"use client";

import { AlertTriangle, BadgeCheck, Banknote, ImageUp, Loader2, QrCode, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_ACCOUNT } from "@/data/payments";
import { formatDateTime, peso } from "@/lib/format";
import { imageFileToDataUrl } from "@/lib/image";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order, PaymentMethod } from "@/types/order";
import { PaymentBadge } from "./badges";

// Shared payment building blocks used by the POS, the Orders page and checkout.

// ── QR placeholder ───────────────────────────────────────────────────────────

/** Where Bambam's payment QR will appear. We never generate a real banking QR. */
export function PaymentQr({ method, amount, className }: { method: PaymentMethod; amount: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-xl border bg-white p-3", className)}>
      {PAYMENT_ACCOUNT.qrImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- owner-provided QR file
        <img src={PAYMENT_ACCOUNT.qrImage} alt={`${PAYMENT_METHOD_LABELS[method]} QR for ${PAYMENT_ACCOUNT.accountName}`} className="size-28 rounded-lg" />
      ) : (
        <div className="grid size-28 shrink-0 place-items-center rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/40 text-center" role="img" aria-label="Payment QR placeholder">
          <span>
            <QrCode className="mx-auto size-9 text-muted-foreground" aria-hidden />
            <span className="block px-1 text-[10px] leading-tight font-semibold text-muted-foreground">QR placeholder</span>
          </span>
        </div>
      )}
      <dl className="min-w-0 space-y-1 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Amount due</dt>
          <dd className="text-2xl font-bold tabular-nums">{peso(amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pay via</dt>
          <dd className="font-semibold">{PAYMENT_METHOD_LABELS[method]} · {PAYMENT_ACCOUNT.accountName}</dd>
        </div>
        {!PAYMENT_ACCOUNT.qrImage && <dd className="text-[11px] text-muted-foreground">{PAYMENT_ACCOUNT.note}</dd>}
      </dl>
    </div>
  );
}

// ── Cash ─────────────────────────────────────────────────────────────────────

/** Cash received → change. The recorded sale is always the ORDER TOTAL. */
export function CashPaymentPanel({ total, cashReceived, onChange }: { total: number; cashReceived: string; onChange: (value: string) => void }) {
  const inputId = useId();
  const cash = Number(cashReceived) || 0;
  const change = cash - total;
  const short = cashReceived !== "" && change < 0;
  // Suggest common bills that cover the total
  const quick = [100, 200, 500, 1000].filter((b) => b >= total).slice(0, 3);

  return (
    <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Order total</span>
        <span className="font-bold tabular-nums">{peso(total)}</span>
      </div>
      <Label htmlFor={inputId}>Cash received</Label>
      <Input
        id={inputId}
        inputMode="decimal"
        className="h-11 bg-white text-lg tabular-nums"
        value={cashReceived}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
      />
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(String(total))}>Exact</Button>
        {quick.map((v) => (
          <Button key={v} type="button" variant="outline" size="sm" onClick={() => onChange(String(v))}>₱{v}</Button>
        ))}
      </div>
      {cashReceived !== "" && (
        <dl className="space-y-0.5 border-t pt-2 text-sm" aria-live="polite">
          <div className="flex justify-between">
            <dt>Change</dt>
            <dd className={cn("text-lg font-bold tabular-nums", short ? "text-danger" : "text-success")}>
              {short ? `Short ${peso(-change)}` : peso(change)}
            </dd>
          </div>
          {!short && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <dt>Recorded cash sale</dt>
              <dd className="tabular-nums">{peso(total)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

// ── Proof upload (online Pay Now) ────────────────────────────────────────────

export interface ProofValue {
  imageUrl: string | null;
  reference: string;
}

/** Upload a payment screenshot + optional provider reference. Preview only — no real upload. */
export function PaymentProofUpload({ value, onChange }: { value: ProofValue; onChange: (v: ProofValue) => void }) {
  const fileId = useId();
  const refId = useId();
  const [loading, setLoading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setLoading(true);
    try {
      onChange({ ...value, imageUrl: await imageFileToDataUrl(file) });
    } catch {
      toast.error("Couldn't read that image. Try another one.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Upload proof of payment</p>
        {value.imageUrl ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the user's own file */}
            <img src={value.imageUrl} alt="Your payment screenshot" className="max-h-56 rounded-lg border" />
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="absolute top-1 right-1 bg-white"
              aria-label="Remove image"
              onClick={() => onChange({ ...value, imageUrl: null })}
            >
              <X />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={fileId}
            className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-white p-4 text-sm font-medium text-muted-foreground hover:bg-muted/40 focus-within:outline-2 focus-within:outline-ring"
          >
            {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImageUp className="size-5" aria-hidden />}
            Choose image
            <span className="text-xs font-normal">Screenshot of your successful payment</span>
            <input id={fileId} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        )}
        <p className="text-[11px] text-muted-foreground">Prototype: the image stays in this browser only.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={refId}>Provider reference number <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id={refId} inputMode="numeric" className="h-11 bg-white" placeholder="e.g. 1234567890123" value={value.reference} onChange={(e) => onChange({ ...value, reference: e.target.value })} />
        <p className="text-[11px] text-muted-foreground">This number comes from GCash/Maya/your bank — not from Bambam.</p>
      </div>
    </div>
  );
}

// ── Verification (owner/cashier) ─────────────────────────────────────────────

const ISSUE_REASONS = ["Amount doesn't match", "Payment not received", "Screenshot unclear", "Other"];

/** PAYMENT VERIFICATION card: check the proof, then Verify or flag an issue */
export function PaymentVerificationCard({ order, compact }: { order: Order; compact?: boolean }) {
  const { verifyPayment, markPaymentIssue } = useDemoStore();
  const [showProof, setShowProof] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const p = order.payment;
  const mismatch = p.submittedAmount !== undefined && p.submittedAmount !== order.total;

  return (
    <section aria-label={`Payment verification for ${order.queueNumber}`} className={cn("space-y-3 rounded-xl border bg-card p-4", !compact && "shadow-xs")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Payment verification</p>
        <PaymentBadge status={p.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-xs text-muted-foreground">Order</dt><dd className="text-lg font-bold">{order.queueNumber}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Method</dt><dd className="font-semibold">{PAYMENT_METHOD_LABELS[p.method]}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Amount due</dt><dd className="font-semibold tabular-nums">{peso(order.total)}</dd></div>
        <div>
          <dt className="text-xs text-muted-foreground">Submitted amount</dt>
          <dd className={cn("font-semibold tabular-nums", mismatch && "text-danger")}>
            {p.submittedAmount !== undefined ? peso(p.submittedAmount) : "—"}
            {mismatch && <span className="ml-1 inline-flex items-center gap-0.5 text-xs"><AlertTriangle className="size-3" aria-hidden /> mismatch</span>}
          </dd>
        </div>
        <div><dt className="text-xs text-muted-foreground">Provider reference</dt><dd className="font-mono text-xs">{p.providerReference ?? "Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Payment ID</dt><dd className="font-mono text-xs">{p.id}</dd></div>
        {p.submittedAt && <div className="col-span-2"><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="text-xs">{formatDateTime(p.submittedAt)}</dd></div>}
      </dl>

      {p.proofImageUrl && (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowProof(true)}>
          <ImageUp /> View proof
        </Button>
      )}

      {flagging ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">What&apos;s the problem?</p>
          <div className="flex flex-wrap gap-1.5">
            {ISSUE_REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  markPaymentIssue(order.id, r);
                  setFlagging(false);
                  toast.warning(`${order.queueNumber}: payment marked as an issue. The customer was notified.`);
                }}
              >
                {r}
              </Button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setFlagging(false)}>Cancel</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={() => setFlagging(true)}>
            <AlertTriangle /> Payment issue
          </Button>
          <Button
            type="button"
            className="h-11 bg-success text-white hover:bg-success/90"
            onClick={() => {
              verifyPayment(order.id);
              toast.success(`${order.queueNumber}: payment verified`);
            }}
          >
            <BadgeCheck /> Verify payment
          </Button>
        </div>
      )}

      <Dialog open={showProof} onOpenChange={setShowProof}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proof of payment · {order.queueNumber}</DialogTitle>
            <DialogDescription>Check the amount, recipient and reference before verifying.</DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element -- customer-uploaded proof */}
          {p.proofImageUrl && <img src={p.proofImageUrl} alt={`Payment proof for ${order.queueNumber}`} className="mx-auto max-h-[60dvh] rounded-lg border" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Collect payment in person ────────────────────────────────────────────────

const COUNTER_METHODS: PaymentMethod[] = ["cash", "gcash", "maya", "bank_transfer"];

/**
 * Cashier collects payment for an existing order (e.g. online "Cash at Pickup"
 * when the customer arrives). Cash → change; GCash/Maya → show QR, then the
 * cashier marks it verified after seeing the customer's success screen.
 */
export function CollectPaymentForm({ order, onDone }: { order: Order; onDone?: () => void }) {
  const { collectPayment } = useDemoStore();
  const [method, setMethod] = useState<PaymentMethod>(order.payment.method);
  const [cashReceived, setCashReceived] = useState("");
  const [reference, setReference] = useState("");
  const refId = useId();
  const cashOk = (Number(cashReceived) || 0) >= order.total;

  function submit() {
    collectPayment(order.id, { method, cashReceived: method === "cash" ? Number(cashReceived) : undefined, providerReference: reference.trim() || undefined });
    toast.success(
      method === "cash"
        ? `${order.queueNumber} paid · change ${peso(Number(cashReceived) - order.total)}`
        : `${order.queueNumber}: ${PAYMENT_METHOD_LABELS[method]} payment verified`,
    );
    onDone?.();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Payment method">
        {COUNTER_METHODS.map((m) => (
          <Button key={m} type="button" role="radio" aria-checked={method === m} variant={method === m ? "default" : "outline"} className="h-10 px-1 text-xs" onClick={() => setMethod(m)}>
            {m === "bank_transfer" ? "Bank" : PAYMENT_METHOD_LABELS[m]}
          </Button>
        ))}
      </div>
      {method === "cash" ? (
        <>
          <CashPaymentPanel total={order.total} cashReceived={cashReceived} onChange={setCashReceived} />
          <Button className="h-12 w-full text-base font-bold" disabled={!cashOk} onClick={submit}>
            <Banknote /> Collect {peso(order.total)} cash
          </Button>
        </>
      ) : (
        <>
          <PaymentQr method={method} amount={order.total} />
          <p className="text-sm text-muted-foreground">Ask the customer to pay, then check their success screen.</p>
          <div className="space-y-1.5">
            <Label htmlFor={refId}>Provider reference <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id={refId} inputMode="numeric" className="h-10" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <Button className="h-12 w-full bg-success text-base font-bold text-white hover:bg-success/90" onClick={submit}>
            <BadgeCheck /> Mark payment verified
          </Button>
        </>
      )}
    </div>
  );
}
