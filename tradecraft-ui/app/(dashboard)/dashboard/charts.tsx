"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTokens } from "@/components/dashboard/chart-theme";
import type { EquityPoint } from "@/lib/dashboard/dashboard-data";
import { usdSigned } from "@/lib/dashboard/format";
import type { SessionHour } from "@/lib/dashboard/dashboard-data";
import { pad2 } from "@/lib/dashboard/format";

/* Shared tooltip shell */

function TipShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs whitespace-nowrap">
      <span className="text-muted-foreground">{title} </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

/* Equity curve */

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const t = useChartTokens();
  if (!data.length) {
    return (
      <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border px-4 text-center text-sm text-subtle-foreground">
        No trades in this period — log your first trade to start the curve.
      </div>
    );
  }
  const values = data.map((d) => d.value);
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const pad = (mx - mn) * 0.1 || 1;
  const ticks = [0, 1, 2, 3, 4].map(
    (i) => data[Math.round((i * (data.length - 1)) / 4)].label,
  );
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="dashEqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={t.chart1} stopOpacity={0.08} />
              <stop offset="1" stopColor={t.chart1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis
            dataKey="label"
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={{ fill: t.tick, fontSize: 11, fontFamily: t.mono }}
            dy={6}
          />
          <YAxis
            domain={[mn - pad, mx + pad]}
            width={52}
            tickLine={false}
            axisLine={false}
            tick={{ fill: t.tick, fontSize: 11, fontFamily: t.mono }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            cursor={{ stroke: t.tick }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipShell title={String(payload[0].payload.label)}>
                  {usdSigned(Number(payload[0].value))}
                </TipShell>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={t.chart1}
            strokeWidth={2}
            fill="url(#dashEqFill)"
            dot={false}
            activeDot={{ r: 4, fill: t.chart1, stroke: t.grid, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Performance radar */

export function RadarView({ data }: { data: { axis: string; score: number }[] }) {
  const t = useChartTokens();
  return (
    <ResponsiveContainer width="100%" height={155}>
      <RadarChart data={data} outerRadius={58} cx="50%" cy="50%">
        <PolarGrid stroke={t.grid} />
        <PolarAngleAxis
          dataKey="axis"
          tickLine={false}
          tick={(props: {
            x?: number | string;
            y?: number | string;
            textAnchor?: "inherit" | "start" | "middle" | "end";
            index?: number;
          }) => {
            const d = data[props.index ?? 0];
            if (!d) return <g />;
            const x = Number(props.x);
            const y = Number(props.y);
            return (
              <g>
                <text
                  x={x}
                  y={y}
                  textAnchor={props.textAnchor}
                  fill={t.chart2}
                  fontSize={12}
                >
                  {d.axis}
                </text>
                <text
                  x={x}
                  y={y + 13}
                  textAnchor={props.textAnchor}
                  fill={t.chart1}
                  fontSize={12}
                  fontWeight={500}
                  fontFamily={t.mono}
                >
                  {d.score}
                </text>
              </g>
            );
          }}
        />
        <Radar
          dataKey="score"
          stroke={t.chart1}
          strokeWidth={2}
          fill={t.chart1}
          fillOpacity={0.08}
          dot={{ r: 3, fill: t.chart1, stroke: "none" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* Active sessions */

export function SessionsChart({ hours }: { hours: SessionHour[] }) {
  const t = useChartTokens();
  return (
    <div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={hours}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            <XAxis dataKey="h" hide />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: t.grid, opacity: 0.4 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TipShell title={`${pad2(Number(payload[0].payload.h))}:00`}>
                    London {payload[0].value} · Frankfurt {payload[1].value} · New York{" "}
                    {payload[2].value}
                  </TipShell>
                ) : null
              }
            />
            <Bar dataKey="london" stackId="s" fill={t.chart2} />
            <Bar dataKey="frankfurt" stackId="s" fill={t.chart3} />
            <Bar
              dataKey="newyork"
              stackId="s"
              fill={t.chart1}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex h-4 items-start justify-between font-mono text-xs text-subtle-foreground">
        {[0, 6, 12, 18].map((h) => (
          <span key={h}>{pad2(h)}</span>
        ))}
      </div>
    </div>
  );
}
