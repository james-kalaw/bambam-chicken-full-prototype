"use client";

import { AlertCircle, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { OrderTypeIcon } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Mascot } from "@/components/shared/mascot";
import { DEMO_CONFIG, type PickupSlot } from "@/data/demo-config";
import { formatMobile, peso } from "@/lib/format";
import { itemsSubtotal, lineTotal, ORDER_TYPE_LABELS, optionsSummary } from "@/lib/order-utils";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderType, PaymentMethod, PaymentTiming } from "@/types/order";
import { PaymentProofUpload, PaymentQr, type ProofValue } from "@/components/shared/payment-panels";

const ORDER_TYPES: { id: OrderType; hint: string }[] = [
  { id: "pickup", hint: "Order ahead, skip the line" },
  { id: "takeout", hint: "Prepared when you arrive" },
  { id: "dine_in", hint: "Eat at the restaurant" },
  { id: "delivery", hint: "Subject to confirmation" },
];

function slotText(slot: PickupSlot) {
  if (slot.status === "full") return "FULL";
  if (slot.status === "limited") return `${slot.slotsLeft} slots left`;
  return "Available";
}

/** Big tappable card used for radio options on this page */
function OptionCard({ id, value, active, disabled, children }: { id: string; value: string; active: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white p-3 transition-colors",
        active ? "border-bambam-orange bg-accent" : "border-transparent ring-1 ring-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} />
      {children}
    </Label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, customerSession, onlineOrderingOpen, placeOnlineOrder } = useDemoStore();

  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [timing, setTiming] = useState<"asap" | "schedule">("schedule");
  const [slot, setSlot] = useState("12:30 PM");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  // GCash/Maya/bank: pay now (send proof) or pay later (at pickup/counter)
  const [payTiming, setPayTiming] = useState<PaymentTiming>("pay_later");
  const [proof, setProof] = useState<ProofValue>({ imageUrl: null, reference: "" });
  const [delivery, setDelivery] = useState({
    name: customerSession?.name ?? "",
    mobile: customerSession ? formatMobile(customerSession.mobile) : "",
    address: "",
    landmark: "",
    instructions: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = itemsSubtotal(cart);
  const total = subtotal + DEMO_CONFIG.onlineServiceFee;

  if (cart.length === 0) {
    return (
      <EmptyState
        mood="hungry"
        title="Your tray is still empty!"
        description="Add something tasty before checking out."
        action={<Button asChild className="rounded-full"><Link href="/customer/menu">Browse Menu</Link></Button>}
      />
    );
  }

  // Customers sign in once with mobile OTP, then stay signed in on this device.
  if (!customerSession) {
    return (
      <EmptyState
        mood="happy"
        title="Sign in to place your order"
        description="Just your mobile number and a one-time code. You'll stay signed in next time."
        action={
          <Button asChild size="lg" className="rounded-full">
            <Link href="/auth/customer?next=/customer/checkout">Continue with mobile number</Link>
          </Button>
        }
      />
    );
  }

  const deliveryIncomplete = orderType === "delivery" && (!delivery.name.trim() || !delivery.mobile.trim() || !delivery.address.trim());

  const payNow = payment !== "cash" && payTiming === "pay_now";
  const proofMissing = payNow && !proof.imageUrl;

  function submit() {
    setError(null);
    setSubmitting(true);
    // Short pause so the "placing order" state is visible during the pitch
    setTimeout(() => {
      const result = placeOnlineOrder({
        orderType,
        paymentMethod: payment,
        timing: payNow ? "pay_now" : "pay_later",
        proof: payNow && proof.imageUrl ? { proofImageUrl: proof.imageUrl, providerReference: proof.reference.trim() || undefined, submittedAmount: total } : undefined,
        scheduledTime: orderType === "pickup" ? (timing === "asap" ? "ASAP" : slot) : undefined,
        delivery: orderType === "delivery" ? { ...delivery, mobile: delivery.mobile.replace(/\D/g, "") } : undefined,
      });
      setSubmitting(false);
      if (result.ok) {
        router.push(`/customer/orders/${result.order.id}?placed=1`);
      } else {
        setError(result.error); // cart is kept
      }
    }, 900);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>

        {!onlineOrderingOpen && (
          <Alert className="border-amber-300 bg-warning-soft">
            <AlertCircle aria-hidden />
            <AlertTitle>Online ordering is temporarily paused.</AlertTitle>
            <AlertDescription>Bambam is very busy right now. Your cart is saved — please try again in a few minutes.</AlertDescription>
          </Alert>
        )}

        {/* 1. Order type */}
        <fieldset className="space-y-3">
          <legend className="mb-3 font-display text-xl font-semibold">1. How will you get your order?</legend>
          <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as OrderType)} className="grid-cols-2">
            {ORDER_TYPES.map((t) => (
              <OptionCard key={t.id} id={`type-${t.id}`} value={t.id} active={orderType === t.id}>
                <OrderTypeIcon type={t.id} className="size-5 text-bambam-red" />
                <span>
                  <span className="block font-semibold">{ORDER_TYPE_LABELS[t.id]}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{t.hint}</span>
                </span>
              </OptionCard>
            ))}
          </RadioGroup>
        </fieldset>

        {/* 2. Timing / delivery details */}
        {orderType === "pickup" && (
          <fieldset className="space-y-3">
            <legend className="mb-3 font-display text-xl font-semibold">2. Pickup time</legend>
            <RadioGroup value={timing} onValueChange={(v) => setTiming(v as "asap" | "schedule")} className="grid-cols-2">
              <OptionCard id="timing-asap" value="asap" active={timing === "asap"}><span className="font-semibold">ASAP</span></OptionCard>
              <OptionCard id="timing-schedule" value="schedule" active={timing === "schedule"}><span className="font-semibold">Schedule pickup</span></OptionCard>
            </RadioGroup>
            {timing === "schedule" && (
              <>
                <RadioGroup value={slot} onValueChange={setSlot} className="grid-cols-1 sm:grid-cols-2" aria-label="Pickup slot">
                  {DEMO_CONFIG.pickupSlots.map((s) => (
                    <OptionCard key={s.label} id={`slot-${s.label}`} value={s.label} active={slot === s.label} disabled={s.status === "full"}>
                      <span className="flex flex-1 items-center justify-between gap-2">
                        <span className="font-semibold tabular-nums">{s.range}</span>
                        <span className={cn("text-xs font-semibold", s.status === "full" ? "text-danger" : s.status === "limited" ? "text-warning" : "text-success")}>
                          {slotText(s)}
                        </span>
                      </span>
                    </OptionCard>
                  ))}
                </RadioGroup>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5" aria-hidden /> Slot availability is simulated for this prototype.
                </p>
              </>
            )}
          </fieldset>
        )}

        {orderType === "delivery" && (
          <fieldset className="space-y-3">
            <legend className="mb-3 font-display text-xl font-semibold">2. Delivery details</legend>
            <Alert className="border-amber-300 bg-warning-soft">
              <Info aria-hidden />
              <AlertTitle>Delivery arrangement is subject to restaurant confirmation.</AlertTitle>
              <AlertDescription>Bambam arranges deliveries manually. Delivery fee: {DEMO_CONFIG.deliveryFeeLabel}.</AlertDescription>
            </Alert>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">Customer name</Label>
                <Input id="d-name" className="h-11 bg-white" value={delivery.name} onChange={(e) => setDelivery({ ...delivery, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-mobile">Mobile number</Label>
                <Input id="d-mobile" inputMode="tel" className="h-11 bg-white" value={delivery.mobile} onChange={(e) => setDelivery({ ...delivery, mobile: e.target.value })} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="d-address">Delivery address</Label>
                <Input id="d-address" className="h-11 bg-white" placeholder="Building, room / street" value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="d-landmark">Landmark <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="d-landmark" className="h-11 bg-white" value={delivery.landmark} onChange={(e) => setDelivery({ ...delivery, landmark: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="d-notes">Delivery instructions <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="d-notes" className="bg-white" value={delivery.instructions} onChange={(e) => setDelivery({ ...delivery, instructions: e.target.value })} />
              </div>
            </div>
          </fieldset>
        )}

        {/* 3. Payment */}
        <fieldset className="space-y-3">
          <legend className="mb-3 font-display text-xl font-semibold">{orderType === "pickup" || orderType === "delivery" ? "3" : "2"}. Payment method</legend>
          <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)} className="grid-cols-1 sm:grid-cols-2">
            {DEMO_CONFIG.paymentMethods.map((m) => (
              <OptionCard key={m.id} id={`pay-${m.id}`} value={m.id} active={payment === m.id}>
                <span>
                  <span className="block font-semibold">{m.id === "cash" && orderType === "pickup" ? "Cash at Pickup" : m.label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{m.hint}</span>
                </span>
              </OptionCard>
            ))}
          </RadioGroup>
          {payment !== "cash" && (
            <div className="space-y-3 rounded-2xl border bg-white p-4">
              <p className="font-semibold">How would you like to pay?</p>
              <RadioGroup value={payTiming} onValueChange={(v) => setPayTiming(v as PaymentTiming)} className="grid-cols-2">
                <OptionCard id="timing-now" value="pay_now" active={payTiming === "pay_now"}>
                  <span className="font-semibold">PAY NOW</span>
                </OptionCard>
                <OptionCard id="timing-later" value="pay_later" active={payTiming === "pay_later"}>
                  <span className="font-semibold">{orderType === "pickup" ? "PAY AT PICKUP" : "PAY LATER"}</span>
                </OptionCard>
              </RadioGroup>
              {payNow ? (
                <>
                  <PaymentQr method={payment} amount={total} />
                  <PaymentProofUpload value={proof} onChange={setProof} />
                  <p className="text-xs text-muted-foreground">Bambam will verify your payment. Until then it shows as “Pending Verification”.</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">You&apos;ll pay when you {orderType === "delivery" ? "receive your order" : "claim your order"}. Your order shows as “Unpaid” until then.</p>
              )}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" aria-hidden /> No real payment is processed. Supported methods are pending owner confirmation.
          </p>
        </fieldset>
      </div>

      {/* Summary */}
      <aside aria-label="Order summary" className="h-fit space-y-4 rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <h2 className="font-display text-xl font-semibold">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {cart.map((item) => (
            <li key={item.lineId} className="flex justify-between gap-3">
              <span>
                <span className="font-semibold">{item.quantity} × {item.productName}</span>
                {item.options.length > 0 && <span className="block text-xs text-muted-foreground">{optionsSummary(item.options)}</span>}
              </span>
              <span className="shrink-0 tabular-nums">{peso(lineTotal(item))}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{peso(subtotal)}</dd></div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-muted-foreground"><dt>Delivery fee</dt><dd>To be confirmed</dd></div>
          )}
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{peso(total)}</dd></div>
        </dl>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-danger-soft p-3">
            <Mascot mood="disappointed" size="sm" />
            <div className="text-sm">
              <p className="font-semibold text-danger">{error}</p>
              <p className="text-muted-foreground">Don&apos;t worry, your cart is still here.</p>
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base font-bold"
          disabled={submitting || !onlineOrderingOpen || deliveryIncomplete || proofMissing}
          onClick={submit}
        >
          {submitting ? <><Loader2 className="animate-spin" /> Placing order…</> : payNow ? `SUBMIT ORDER & PAYMENT · ${peso(total)}` : `PLACE ORDER · ${peso(total)}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Bambam will confirm your order before it goes to the kitchen.
        </p>
      </aside>
    </div>
  );
}
