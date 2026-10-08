"use client";

import { Database, KeyRound, Laptop, Lock, ShieldCheck, Smartphone, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEMO_CONFIG } from "@/data/demo-config";
import { useDemoStore } from "@/lib/store";

function Row({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="font-semibold">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { onlineOrderingOpen, setOnlineOrdering, simulateSubmitError, setSimulateSubmitError, resetDemo } = useDemoStore();
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Store controls, security and data privacy.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Online ordering</CardTitle>
          <CardDescription>Use during extreme rush hours to stop new online orders temporarily.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <Row id="online" title={onlineOrderingOpen ? "● Accepting orders" : "○ Temporarily paused"} description="Customers see the current status on the home page and checkout.">
            <Switch id="online" checked={onlineOrderingOpen} onCheckedChange={setOnlineOrdering} />
          </Row>
          <Row id="max-pickup" title="Maximum pickup orders per 15 minutes" description="Not set yet — the owners will decide this limit. Future feature.">
            <Input id="max-pickup" disabled placeholder={DEMO_CONFIG.maxPickupOrdersPer15Min === null ? "Not set" : String(DEMO_CONFIG.maxPickupOrdersPer15Min)} className="w-28" />
          </Row>
          <Row id="sound" title="Sound alert for new orders" description="Shown visually in the prototype; real sound and push notifications come later.">
            <Switch id="sound" checked={soundAlerts} onCheckedChange={setSoundAlerts} />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>How staff accounts are protected in the full system.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            <li className="flex gap-2"><KeyRound className="size-4 shrink-0 text-bambam-red" aria-hidden /> Staff sign in with password + one-time code (2FA)</li>
            <li className="flex gap-2"><Smartphone className="size-4 shrink-0 text-bambam-red" aria-hidden /> Customers sign in with mobile OTP and stay signed in</li>
            <li className="flex gap-2"><Lock className="size-4 shrink-0 text-bambam-red" aria-hidden /> Failed-login limits and password reset</li>
            <li className="flex gap-2"><Timer className="size-4 shrink-0 text-bambam-red" aria-hidden /> Automatic session expiry</li>
            <li className="flex gap-2"><Laptop className="size-4 shrink-0 text-bambam-red" aria-hidden /> See active devices and sign out remotely</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-bambam-red" aria-hidden /> Re-enter password for sensitive actions</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="size-4" aria-hidden /> Your data, your business</CardTitle>
          <CardDescription>Bambam owns its business and customer data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Developers will not have routine access to production customer or business records. Any required production access should be
            limited, authorized, temporary, and logged.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Developers work on a separate development database filled with fake test data.</li>
            <li>Data is encrypted in transit (HTTPS) and at rest, with secure backups.</li>
            <li>Passwords are never stored in readable form.</li>
            <li>Card numbers, CVV and PINs are never stored — payments go through an approved payment provider; only references, amounts and status are kept.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Pitch demo tools</CardTitle>
          <CardDescription>Only exist in this prototype.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <Row id="sim-error" title="Make the next online order fail" description="Shows the error state. The customer's cart is kept.">
            <Switch id="sim-error" checked={simulateSubmitError} onCheckedChange={setSimulateSubmitError} />
          </Row>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">Reset demo data</p>
              <p className="text-sm text-muted-foreground">Restores the starting orders, inventory, notifications and logs.</p>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => { resetDemo(); setConfirmReset(false); toast.success("Demo data reset"); }}>Yes, reset</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setConfirmReset(true)}>Reset…</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
