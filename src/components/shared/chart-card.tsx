"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChartTable {
  headers: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  description?: string;
  /** Data shown when the viewer switches to the table view (accessibility) */
  table?: ChartTable;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Height of the chart area in px */
  height?: number;
}

/** Card wrapper for every chart, with a chart/table toggle */
export function ChartCard({ title, description, table, action, children, className, height = 240 }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction className="flex items-center gap-2">
          {action}
          {table && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowTable((v) => !v)}
              aria-label={showTable ? `Show ${title} as chart` : `Show ${title} as table`}
              aria-pressed={showTable}
            >
              {showTable ? <BarChart3 /> : <Table2 />}
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {showTable && table ? (
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {table.headers.map((h) => (
                    <th key={h} scope="col" className="py-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 pr-3 tabular-nums">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height }} className="w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** Tooltip body used by all Recharts charts */
export function ChartTooltipBox({ title, lines }: { title: string; lines: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l.label} className="flex items-center gap-2 text-muted-foreground">
          {l.color && <span className="inline-block size-2.5 rounded-sm" style={{ background: l.color }} aria-hidden />}
          {l.label}: <span className="font-semibold text-foreground tabular-nums">{l.value}</span>
        </p>
      ))}
    </div>
  );
}
