import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStats, AdminRevenue } from "@/hooks/useAdmin";

/* ── tooltip ── */
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name ?? p.dataKey}:{" "}
          <span className="font-semibold text-foreground">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function DollarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name ?? p.dataKey}:{" "}
          <span className="font-semibold text-foreground">${p.value?.toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function PlanTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground capitalize">{d.plan}</p>
      <p className="text-muted-foreground">
        {d.purchases} purchase{d.purchases !== 1 ? "s" : ""} · <span className="font-semibold text-foreground">${d.revenue.toFixed(2)}</span>
      </p>
    </div>
  );
}

const axisStyle = { fontSize: 11 };

/* ── mock data generators ── */

function generateUserGrowth(totalUsers: number) {
  const data: { date: string; users: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const progress = (30 - i) / 30;
    const val = Math.round(totalUsers * 0.6 + totalUsers * 0.4 * progress + (Math.random() - 0.5) * totalUsers * 0.03);
    data.push({ date: label, users: i === 0 ? totalUsers : Math.max(val, 1) });
  }
  return data;
}

function generateRevenueSeries(totalCents: number) {
  const total = totalCents / 100;
  const data: { date: string; revenue: number }[] = [];
  const now = new Date();
  const spikeDays = new Set([3, 7, 12, 18, 22, 27]);
  let cumulative = 0;
  const dailyBase = total / 30;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayIdx = 30 - i;
    const spike = spikeDays.has(dayIdx) ? 2.5 + Math.random() * 2 : 0.5 + Math.random();
    cumulative += dailyBase * spike;
    data.push({ date: label, revenue: i === 0 ? Math.round(total * 100) / 100 : Math.round(Math.min(cumulative, total) * 100) / 100 });
  }
  return data;
}

function generateRevenueBarSeries(totalCents: number) {
  const total = totalCents / 100;
  const data: { date: string; revenue: number }[] = [];
  const now = new Date();
  let remaining = total;
  const rawValues: number[] = [];
  for (let i = 0; i < 30; i++) {
    const v = Math.random() * (total / 10);
    rawValues.push(v);
  }
  const sum = rawValues.reduce((a, b) => a + b, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayIdx = 29 - i;
    const val = sum > 0 ? Math.round((rawValues[dayIdx] / sum) * total * 100) / 100 : 0;
    data.push({ date: label, revenue: val });
  }
  return data;
}

/* ── Overview Analytics ── */

interface OverviewProps {
  stats?: AdminStats;
  statsLoading: boolean;
  revenue?: AdminRevenue;
  revenueLoading: boolean;
}

export function AdminOverviewAnalytics({ stats, statsLoading, revenue, revenueLoading }: OverviewProps) {
  const userGrowth = useMemo(() => (stats ? generateUserGrowth(stats.totalUsers) : []), [stats]);
  const revenueBars = useMemo(() => (revenue ? generateRevenueBarSeries(revenue.totalRevenueCents) : []), [revenue]);

  const planColors: Record<string, string> = { starter: "#6b7280", growth: "#10b981", scale: "#f59e0b" };
  const planData = useMemo(() => {
    if (!revenue?.byPlan) return [];
    return ["starter", "growth", "scale"].map((plan) => ({
      plan,
      revenue: (revenue.byPlan[plan]?.revenueCents ?? 0) / 100,
      purchases: revenue.byPlan[plan]?.count ?? 0,
      fill: planColors[plan],
    }));
  }, [revenue]);

  const allZero = planData.every((p) => p.revenue === 0);
  const loading = statsLoading || revenueLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
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
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </div>

      {/* Row 1: User growth + Revenue bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User growth */}
        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm font-medium mb-1">New users</p>
            <p className="text-[10px] text-muted-foreground mb-3">Historical tracking coming soon — showing sample trend data</p>
            <div className="h-52 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="adminUserGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fill="url(#adminUserGrad)" dot={false} name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue bars */}
        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm font-medium mb-1">Revenue</p>
            <p className="text-[10px] text-muted-foreground mb-3">Historical tracking coming soon — showing sample trend data</p>
            <div className="h-52 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBars}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis dataKey="date" tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} width={35} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<DollarTooltip />} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue by plan (horizontal bar) */}
      <Card className="shadow-none">
        <CardContent className="p-5">
          <p className="text-sm font-medium mb-3">Revenue by plan</p>
          {allZero ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No purchases yet</p>
          ) : (
            <div className="h-48 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData} layout="vertical" barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                  <XAxis type="number" tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="plan" tick={axisStyle} className="fill-muted-foreground capitalize" tickLine={false} axisLine={false} width={60} />
                  <Tooltip content={<PlanTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                    {planData.map((entry) => (
                      <Cell key={entry.plan} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Revenue page chart ── */

interface RevenueChartProps {
  revenue?: AdminRevenue;
  isLoading: boolean;
}

export function AdminRevenueChart({ revenue, isLoading }: RevenueChartProps) {
  const series = useMemo(() => (revenue ? generateRevenueSeries(revenue.totalRevenueCents) : []), [revenue]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <p className="text-sm font-medium mb-1">Revenue over time</p>
        <p className="text-[10px] text-muted-foreground mb-3">Historical tracking coming soon — showing sample trend data</p>
        <div className="h-56 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="date" tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={axisStyle} className="fill-muted-foreground" tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<DollarTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#adminRevGrad)" dot={false} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Users page stat cards ── */

interface UserStatsProps {
  stats?: AdminStats;
  isLoading: boolean;
}

export function AdminUserStats({ stats, isLoading }: UserStatsProps) {
  const cards = [
    { label: "Total users", value: stats?.totalUsers },
    { label: "New this week", value: stats?.newUsersThisWeek },
    { label: "Active this week", value: stats?.activeUsersThisWeek },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground">{c.label}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="mt-1 text-xl font-semibold">{c.value?.toLocaleString() ?? "—"}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
