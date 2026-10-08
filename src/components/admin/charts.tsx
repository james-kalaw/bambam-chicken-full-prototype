"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox } from "@/components/shared/chart-card";
import { CHART_COLORS } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

const axisTick = { fill: CHART_COLORS.axis, fontSize: 12 };

interface ColumnChartProps<T> {
  data: T[];
  xKey: string;
  yKey: string;
  /** Label used in the tooltip, e.g. "Revenue" */
  valueLabel: string;
  format: (n: number) => string;
  /** Bars where this returns true use the strong color (e.g. "today") */
  highlight?: (row: T) => boolean;
}

/** Vertical bars for one series over time (days, hours, weeks) */
export function ColumnChart<T extends object>({ data, xKey, yKey, valueLabel, format, highlight }: ColumnChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={52} tickFormatter={(v: number) => format(v)} />
        <Tooltip
          cursor={{ fill: "rgba(59,42,31,0.05)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltipBox title={String(label)} lines={[{ label: valueLabel, value: format(Number(payload[0].value)), color: CHART_COLORS.primary }]} />
            ) : null
          }
        />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((row, i) => (
            <Cell key={i} fill={!highlight || highlight(row) ? CHART_COLORS.primary : CHART_COLORS.primarySoft} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Two-series line chart (e.g. new vs returning customers). Uses the validated pair. */
export function TwoLineChart<T extends object>({ data, xKey, series, format }: {
  data: T[];
  xKey: string;
  series: [{ key: string; label: string }, { key: string; label: string }];
  format: (n: number) => string;
}) {
  const colors = [CHART_COLORS.primary, CHART_COLORS.secondary];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={44} tickFormatter={(v: number) => format(v)} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltipBox
                title={String(label)}
                lines={payload.map((p, i) => ({ label: String(p.name), value: format(Number(p.value)), color: colors[i] }))}
              />
            ) : null
          }
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colors[i]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Horizontal bar list in plain HTML — easy for non-technical owners to read,
 * with the value always written next to each bar (no color-only meaning).
 */
export function BarList({ items, format, className }: {
  items: { label: string; value: number; sublabel?: string }[];
  format: (n: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">
              {item.label}
              {item.sublabel && <span className="ml-1 text-xs text-muted-foreground">{item.sublabel}</span>}
            </span>
            <span className="font-semibold tabular-nums">{format(item.value)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: CHART_COLORS.primary }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
