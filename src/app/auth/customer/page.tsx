"use client";

import { ArrowLeft, Info, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mascot } from "@/components/shared/mascot";
import { DEMO_CONFIG } from "@/data/demo-config";
import { formatMobile } from "@/lib/format";
import { useDemoStore } from "@/lib/store";

// SIMULATED mobile OTP sign-in. No SMS is sent; any 6-digit code works.
// Flow: Mobile number → Send OTP → Verify → account created/found → stay signed in.

type Step = "mobile" | "otp" | "name" | "done";

export default function CustomerAuthPage() {
  return (
    <Suspense>
      <CustomerAuth />
    </Suspense>
  );
}

function CustomerAuth() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/customer";
  const { signInCustomer, findCustomerByMobile } = useDemoStore();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState(formatMobile(DEMO_CONFIG.demoCustomerMobile));
  const [otp, setOtp] = useState(DEMO_CONFIG.demoOtpCode);
  const [name, setName] = useState("");
  const [trusted, setTrusted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [customerId, setCustomerId] = useState("");

  const digits = mobile.replace(/\D/g, "");
  const validMobile = /^09\d{9}$/.test(digits);

  function fakeDelay(fn: () => void) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      fn();
    }, 700);
  }

  function finish(displayName?: string) {
    const customer = signInCustomer(digits, displayName, trusted);
    setWelcomeName(customer.name.split(" ")[0]);
    setCustomerId(customer.id);
    setStep("done");
    setTimeout(() => router.push(next), 1600);
  }

  return (
    <div className="theme-customer grid min-h-dvh place-items-center bg-bambam-cream px-4 py-10">
      <div className="w-full max-w-sm space-y-4">
        <Link href="/customer" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to Bambam
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          {step === "done" ? (
            <div className="space-y-2 py-4 text-center" role="status">
              <Mascot mood="happy" size="lg" className="mx-auto" />
              <h1 className="font-display text-2xl font-bold">Welcome{welcomeName ? `, ${welcomeName}` : " back"}!</h1>
              <p className="text-sm text-muted-foreground">Customer ID <span className="font-mono font-semibold text-foreground">{customerId}</span></p>
              {trusted && <p className="text-xs text-muted-foreground">You&apos;ll stay signed in on this device.</p>}
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <Mascot mood="happy" size="sm" />
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    {step === "mobile" ? "Sign in to Bambam" : step === "otp" ? "Enter the code" : "What should we call you?"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {step === "mobile" && "No password needed — just your mobile number."}
                    {step === "otp" && `We sent a 6-digit code to ${formatMobile(digits)}.`}
                    {step === "name" && "New here! This creates your Bambam account."}
                  </p>
                </div>
              </div>

              {step === "mobile" && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (validMobile) fakeDelay(() => setStep("otp"));
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">Mobile number</Label>
                    <Input id="mobile" inputMode="tel" autoComplete="tel" className="h-12 text-lg" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-invalid={mobile.length > 0 && !validMobile} aria-describedby="mobile-hint" />
                    <p id="mobile-hint" className="text-xs text-muted-foreground">Format: 09XX XXX XXXX</p>
                  </div>
                  <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base font-bold" disabled={!validMobile || loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otp.length !== 6) return;
                    fakeDelay(() => {
                      if (findCustomerByMobile(digits)) finish();
                      else setStep("name");
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="otp">6-digit code</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="size-3.5" aria-hidden /> Demo: no SMS is sent. Any 6 digits work.
                    </p>
                  </div>
                  <Label htmlFor="trusted" className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal">
                    <Checkbox id="trusted" checked={trusted} onCheckedChange={(v) => setTrusted(v === true)} className="mt-0.5" />
                    <span>
                      <span className="block font-semibold">Stay signed in on this device</span>
                      <span className="block text-xs text-muted-foreground">You won&apos;t need a code every time you order.</span>
                    </span>
                  </Label>
                  <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base font-bold" disabled={otp.length !== 6 || loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & continue"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("mobile")}>Change number</Button>
                </form>
              )}

              {step === "name" && (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); finish(name); }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" autoComplete="given-name" className="h-12 text-lg" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base font-bold" disabled={!name.trim()}>
                    Create my account
                  </Button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden /> Your number is only used for your Bambam account.
        </p>
      </div>
    </div>
  );
}
