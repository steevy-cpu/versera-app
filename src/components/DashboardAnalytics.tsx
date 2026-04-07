import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Stats, UsageStats, Prompt } from "@/lib/types";

/* ── helpers ── */

function generateResolveSeries(apiCallsToday: number) {
  const data: { date: string; calls: number }[] = [];
  const now = new Date();
  // Build a curve that ends roughly at apiCallsToday
  const base = Math.max(apiCallsToday, 5);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    // simple noisy upward curve
    const progress = (30 - i) / 30;
    const noise = 0.7 + Math.random() * 0.6;
    const val = Math.round(base * progress * noise);
    data.push({ date: label, calls: i === 0 ? apiCallsToday : Math.max(val, 0) });
  }
  return data;
}

function generateCreditsSeries(creditsRemaining: number) {
  const data: { date: string; credits: number }[] = [];
  const now = new Date();
  const start = Math.max(creditsRemaining + 200, 1000);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const progress = (30 - i) / 30;
    const val = Math.round(start - (start - creditsRemaining) * progress + (Math.random() - 0.5) * 20);
    data.push({ date: label, credits: i === 0 ? creditsRemaining : Math.max(val, 0) });
  }
  return data;
}

function groupByEnv(prompts: Prompt[]) {
  const counts = { prod: 0, staging: 0, dev: 0 };
  prompts.forEach((p) => {
    if (p.environment in counts) counts[p.environment as keyof typeof counts]++;
  });
  return [
    { env: "prod", count: counts.prod, fill: "#10b981" },
    { env: "staging", count: counts.staging, fill: "#f59e0b" },
    { env: "dev", count: counts.dev, fill: "#6b7280" },
  ];
}

/* ── tooltip ── */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name ?? p.dataKey}: <span className="font-semibold text-foreground">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

/* ── axis style ── */
const axisStyle = { fontSize: 11 };

/* ── main component ── */

interface Props {
  stats?: Stats;
  statsLoading: boolean;
  usage?: UsageStats;
  usageLoading: boolean;
  prompts?: Prompt[];
  promptsLoading: boolean;
}

export default function DashboardAnalytics({
  stats, statsLoading, usage, usageLoading, prompts, promptsLoading,
}: Props) {
  const resolveSeries = useMemo(
    () => (stats ? generateResolveSeries(stats.apiCallsToday) : []),
    [stats],
  );
  const creditsSeries = useMemo(
    () => (stats ? generateCreditsSeries(stats.creditsRemaining) : []),
    [stats],
  );
  const envData = useMemo(() => (prompts ? groupByEnv(prompts) : []), [prompts]);

  const isEmpty = stats && stats.apiCallsToday === 0 && stats.totalPrompts === 0;

  const creditsUsed = stats ? (stats.creditsRemaining !== undefined ? 1000 - stats.creditsRemaining : 0) : 0;
  const avgPerDay = usage ? Math.round(usage.resolveCalls / 30) : 0;

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* heading */}
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </div>

      {isEmpty ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-2">
              No API calls yet. Make your first resolve call to see analytics.
            </p>
            <Link to="/docs" className="text-sm font-medium text-primary hover:underline">
              Read the docs →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* row 1 — two area charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resolve calls */}
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-sm font-medium mb-1">Resolve calls</p>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Sample data — historical tracking coming soon
                </p>
                <div className="h-52 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resolveSeries}>
                      <defs>
                        <linearGradient id="resolveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis
                        dataKey="date"
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="calls"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#resolveGrad)"
                        dot={false}
                        name="Calls"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Credits remaining */}
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-sm font-medium mb-1">Credits remaining</p>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Sample data — historical tracking coming soon
                </p>
                <div className="h-52 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={creditsSeries}>
                      <defs>
                        <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis
                        dataKey="date"
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <ReferenceLine
                        y={100}
                        stroke="#ef4444"
                        strokeDasharray="6 4"
                        label={{
                          value: "Low credits",
                          position: "insideTopRight",
                          fill: "#ef4444",
                          fontSize: 10,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="credits"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#creditsGrad)"
                        dot={false}
                        name="Credits"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* row 2 — bar chart */}
          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-1">Prompts by environment</p>
              {promptsLoading ? (
                <Skeleton className="h-52" />
              ) : prompts && prompts.length > 0 ? (
                <div className="h-52 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={envData} barSize={48}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                      <XAxis
                        dataKey="env"
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={axisStyle}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        width={30}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" name="Prompts" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
                        {envData.map((entry) => (
                          <Cell key={entry.env} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Create your first prompt to see environment distribution
                </p>
              )}
            </CardContent>
          </Card>

          {/* row 3 — summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Resolve calls this month</p>
                {usageLoading ? (
                  <Skeleton className="mt-1 h-6 w-16" />
                ) : (
                  <p className="mt-1 text-xl font-semibold">{(usage?.resolveCalls ?? 0).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Credits used this month</p>
                <p className="mt-1 text-xl font-semibold">{Math.max(creditsUsed, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Avg calls per day</p>
                {usageLoading ? (
                  <Skeleton className="mt-1 h-6 w-16" />
                ) : (
                  <p className="mt-1 text-xl font-semibold">{avgPerDay.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
