"use client";

import { ArrowLeft, Info, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RoleBadge } from "@/components/shared/badges";
import { BrandLogo } from "@/components/shared/brand-logo";
import { DEMO_CONFIG } from "@/data/demo-config";
import { DEMO_ACCOUNT_IDS } from "@/data/employees";
import { homeModuleFor } from "@/lib/permissions";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// SIMULATED staff sign-in: email/username + password, then OTP / 2FA.
// Every staff member has their own account — there is no shared owner login.

export default function AdminAuthPage() {
  return (
    <Suspense>
      <AdminAuth />
    </Suspense>
  );
}

function AdminAuth() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { employees, signInAdmin } = useDemoStore();
  const accounts = employees.filter((e) => DEMO_ACCOUNT_IDS.includes(e.id));

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [password, setPassword] = useState("demo-password");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [otp, setOtp] = useState(DEMO_CONFIG.demoOtpCode);
  const [loading, setLoading] = useState(false);
  const account = accounts.find((a) => a.id === accountId);

  function delay(fn: () => void) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      fn();
    }, 700);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/60 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Pitch guide
        </Link>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <BrandLogo subtitle="Business System · Staff sign-in" />

          {step === "password" ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (account && password) delay(() => setStep("otp"));
              }}
            >
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-semibold">Demo account</legend>
                <RadioGroup value={accountId} onValueChange={setAccountId}>
                  {accounts.map((a) => (
                    <Label
                      key={a.id}
                      htmlFor={`acc-${a.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 font-normal",
                        accountId === a.id ? "border-bambam-orange bg-accent" : "hover:bg-muted",
                      )}
                    >
                      <RadioGroupItem id={`acc-${a.id}`} value={a.id} />
                      <span className="flex-1">
                        <span className="block font-semibold">{a.name}</span>
                        <span className="block text-xs text-muted-foreground">{a.email}</span>
                      </span>
                      <RoleBadge role={a.role} />
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email or username</Label>
                <Input id="email" readOnly value={account?.email ?? ""} className="h-11 bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={loading || !password}>
                {loading ? <Loader2 className="animate-spin" /> : <><Lock /> Continue</>}
              </Button>
            </form>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (otp.length !== 6 || !account) return;
                delay(() => {
                  signInAdmin(account.id);
                  router.push(next ?? `/admin/${homeModuleFor(account.role)}`);
                });
              }}
            >
              <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm">
                <KeyRound className="mt-0.5 size-4 shrink-0 text-bambam-red" aria-hidden />
                <p>Two-step verification: enter the 6-digit code from your authenticator app or SMS for <strong>{account?.name}</strong>.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck /> Verify & sign in</>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("password")}>Back</Button>
            </form>
          )}
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Prototype only: no real password or code is checked. The real system will add failed-login limits, session expiry and device management.
        </p>
      </div>
    </div>
  );
}
