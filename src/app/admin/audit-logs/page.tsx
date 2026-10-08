"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleBadge } from "@/components/shared/badges";
import { BRANCHES } from "@/data/employees";
import { formatDate, formatTime } from "@/lib/format";
import { useDemoStore } from "@/lib/store";

export default function AuditLogsPage() {
  const { auditLogs } = useDemoStore();
  const [module, setModule] = useState("all");
  const modules = Array.from(new Set(auditLogs.map((l) => l.module))).sort();
  const logs = [...auditLogs]
    .filter((l) => module === "all" || l.module === module)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">A permanent record of sensitive actions: who did what, and when. Actions you take in this demo appear here.</p>
        </div>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="h-10 w-44 bg-card" aria-label="Filter by module"><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All modules</SelectItem>
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <caption className="sr-only">Audit log entries, newest first</caption>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="hidden md:table-cell">Branch</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <p className="font-medium whitespace-nowrap">{l.user}</p>
                  <RoleBadge role={l.role} />
                </TableCell>
                <TableCell className="font-medium">{l.action}</TableCell>
                <TableCell>{l.module}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatTime(l.createdAt)}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{BRANCHES.find((b) => b.id === l.branchId)?.name}</TableCell>
                <TableCell className="min-w-56 text-sm">{l.details ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
