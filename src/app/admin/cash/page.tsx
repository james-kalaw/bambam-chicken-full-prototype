"use client";

import { Info, Lock, LockOpen, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/shared/badges";
import { drawerTotals } from "@/lib/cash-utils";
import { formatDateTime, formatTime, peso } from "@/lib/format";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CashEntryType } from "@/types/cash";

const num = (v: string) => v.replace(/[^\d.]/g, "");

const ENTRY_LABELS: Record<CashEntryType, string> = { sale: "Cash sale", refund: "Cash refund", expense: "Cash expense" };

/**
 * CASH DRAWER — physical cash only.
 * Expected cash = Opening cash + Cash sales − Cash refunds − Cash expenses.
 * Opening cash is NOT revenue, change given is NOT revenue, and the drawer
 * balance is NOT the same thing as sales.
 */
export default function CashPage() {
  const { cashDrawer, recordCashExpense, openCashDrawer, closeCashDrawer } = useDemoStore();
  const totals = drawerTotals(cashDrawer);
  const [counted, setCounted] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [openingCash, setOpeningCash] = useState("2000");

  const countedValue = counted === "" ? undefined : Number(counted);
  const previewDiff = countedValue !== undefined ? countedValue - totals.expectedCash : totals.difference;
  const isOpen = cashDrawer.status === "open";

  const rows: { label: string; value: number; sign?: "+" | "−"; strong?: boolean }[] = [
    { label: "Opening cash", value: cashDrawer.openingCash },
    { label: "Cash sales", value: totals.cashSales, sign: "+" },
    { label: "Cash refunds", value: totals.cashRefunds, sign: "−" },
    { label: "Cash expenses", value: totals.cashExpenses, sign: "−" },
    { label: "Expected cash", value: totals.expectedCash, strong: true },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Drawer</h1>
          <p className="text-sm text-muted-foreground">
            {isOpen ? `Open since ${formatTime(cashDrawer.openedAt)} · opened by ${cashDrawer.openedBy}` : `Closed ${cashDrawer.closedAt ? formatDateTime(cashDrawer.closedAt) : ""} by ${cashDrawer.closedBy ?? ""}`}
          </p>
        </div>
        <DemoBadge>Demo amounts</DemoBadge>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Drawer summary</CardTitle>
            <CardDescription>Physical cash only — GCash/Maya never enter the drawer.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {rows.map((r) => (
                <div key={r.label} className={cn("flex justify-between py-2", r.strong && "text-base font-bold")}>
                  <dt>{r.label}</dt>
                  <dd className="tabular-nums">{r.sign ?? ""}{peso(r.value)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-2">
                <dt><Label htmlFor="counted">Actual cash (counted)</Label></dt>
                <dd>
                  <Input
                    id="counted"
                    inputMode="decimal"
                    className="h-10 w-36 text-right tabular-nums"
                    placeholder={cashDrawer.countedCash !== undefined ? String(cashDrawer.countedCash) : "Count the drawer"}
                    value={counted}
                    onChange={(e) => setCounted(num(e.target.value))}
                  />
                </dd>
              </div>
              <div className="flex justify-between py-2 text-base font-bold">
                <dt>Difference</dt>
                <dd className={cn("tabular-nums", previewDiff === undefined ? "text-muted-foreground" : previewDiff === 0 ? "text-success" : "text-danger")} aria-live="polite">
                  {previewDiff === undefined ? "—" : `${previewDiff > 0 ? "+" : previewDiff < 0 ? "−" : ""}${peso(Math.abs(previewDiff))}`}
                  {previewDiff !== undefined && previewDiff !== 0 && <span className="ml-1 text-xs font-medium">{previewDiff < 0 ? "(short)" : "(over)"}</span>}
                </dd>
              </div>
            </dl>
            {isOpen ? (
              <Button
                className="mt-3 w-full"
                variant="outline"
                disabled={countedValue === undefined}
                onClick={() => {
                  if (countedValue === undefined) return;
                  closeCashDrawer(countedValue);
                  setCounted("");
                  toast.success("Cash drawer closed and saved to the audit log.");
                }}
              >
                <Lock /> Close drawer with this count
              </Button>
            ) : (
              <div className="mt-3 flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="opening">Opening cash for the next shift</Label>
                  <Input id="opening" inputMode="decimal" className="h-10" value={openingCash} onChange={(e) => setOpeningCash(num(e.target.value))} />
                </div>
                <Button className="h-10" disabled={openingCash === ""} onClick={() => { openCashDrawer(Number(openingCash)); toast.success("New cash drawer opened."); }}>
                  <LockOpen /> Open drawer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="size-4" aria-hidden /> Drawer ≠ revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li><strong>Opening cash</strong> is the starting float, not revenue.</li>
                <li><strong>Change given</strong> is not revenue. A ₱620 order paid with ₱1,000 records a ₱620 cash sale.</li>
                <li><strong>Revenue</strong> includes GCash/Maya sales, which never enter the drawer.</li>
              </ul>
            </CardContent>
          </Card>
          {isOpen && (
            <Card>
              <CardHeader>
                <CardTitle>Record cash expense</CardTitle>
                <CardDescription>Cash taken from the drawer to pay for something.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    recordCashExpense(Number(expenseAmount), expenseNote.trim());
                    toast.success("Cash expense recorded.");
                    setExpenseAmount("");
                    setExpenseNote("");
                  }}
                >
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <Input aria-label="Expense amount" inputMode="decimal" placeholder="₱" value={expenseAmount} onChange={(e) => setExpenseAmount(num(e.target.value))} />
                    <Input aria-label="What was it for?" placeholder="What was it for?" value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={!(Number(expenseAmount) > 0) || !expenseNote.trim()}>
                    <Receipt /> Record expense
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash movements</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {cashDrawer.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cash movements yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {cashDrawer.entries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="w-24 text-xs font-semibold text-muted-foreground uppercase">{ENTRY_LABELS[e.type]}</span>
                  <span className={cn("w-24 font-semibold tabular-nums", e.type === "sale" ? "text-success" : "text-danger")}>
                    {e.type === "sale" ? "+" : "−"}{peso(e.amount)}
                  </span>
                  <span className="min-w-0 flex-1">{e.queueNumber ?? e.note}</span>
                  <span className="text-xs text-muted-foreground">{e.by} · {formatTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
