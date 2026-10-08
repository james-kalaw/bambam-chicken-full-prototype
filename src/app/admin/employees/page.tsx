"use client";

import { Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleBadge } from "@/components/shared/badges";
import { Mascot } from "@/components/shared/mascot";
import { BRANCHES } from "@/data/employees";
import { timeAgo } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import { useCurrentEmployee, useDemoStore } from "@/lib/store";
import type { Employee, StaffRole } from "@/types/people";

const ASSIGNABLE: StaffRole[] = ["manager", "cashier", "kitchen"];
const STATUS_LABEL = { active: "Active", inactive: "Inactive", on_leave: "On leave" };

export default function EmployeesPage() {
  const { employees, changeEmployeeRole } = useDemoStore();
  const me = useCurrentEmployee();
  const canChangeRoles = me?.role === "owner" || me?.role === "co_owner";
  const [pending, setPending] = useState<{ employee: Employee; role: StaffRole } | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <p className="text-sm text-muted-foreground">Each person has their own account. Owner and Co-owner never share a login.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Last login</TableHead>
              <TableHead>Change role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => {
              const isOwnerAccount = e.role === "owner" || e.role === "co_owner";
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.email}</p>
                  </TableCell>
                  <TableCell><RoleBadge role={e.role} /></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{BRANCHES.find((b) => b.id === e.branchId)?.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={`size-2 rounded-full ${e.status === "active" ? "bg-success" : e.status === "on_leave" ? "bg-warning" : "bg-muted-foreground"}`} aria-hidden />
                      {STATUS_LABEL[e.status]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{timeAgo(e.lastLogin)}</TableCell>
                  <TableCell>
                    {isOwnerAccount ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3.5" aria-hidden /> Owner account</span>
                    ) : (
                      <Select
                        value={e.role}
                        disabled={!canChangeRoles}
                        onValueChange={(role) => setPending({ employee: e, role: role as StaffRole })}
                      >
                        <SelectTrigger className="h-9 w-40" aria-label={`Role of ${e.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent position="popper">
                          {ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {!canChangeRoles && <p className="text-sm text-muted-foreground">Only Owner accounts can change roles.</p>}

      {/* Sensitive action → always confirm */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>Change {pending.employee.name}&apos;s role?</DialogTitle>
                <DialogDescription>
                  {ROLE_LABELS[pending.employee.role]} → <strong>{ROLE_LABELS[pending.role]}</strong>. Their access changes immediately and this is recorded in the audit log.
                </DialogDescription>
              </DialogHeader>
              <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                In the real system you&apos;ll confirm your password again before sensitive changes like this.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    changeEmployeeRole(pending.employee.id, pending.role);
                    toast.custom(() => (
                      <div className="flex items-center gap-3 rounded-xl border bg-popover p-3 shadow-lg">
                        <Mascot mood="approved" size="sm" />
                        <p className="font-semibold">Changes saved.</p>
                      </div>
                    ));
                    setPending(null);
                  }}
                >
                  Confirm change
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
