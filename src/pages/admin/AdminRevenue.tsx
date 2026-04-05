import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminRevenue } from "@/hooks/useAdmin";

function cents(v: number) {
  return `$${(v / 100).toFixed(2)}`;
}

export default function AdminRevenue() {
  const { data, isLoading, error } = useAdminRevenue();

  const topMetrics = [
    { label: "Total revenue (all time)", value: data ? cents(data.totalRevenueCents) : undefined },
    { label: "This month", value: data ? cents(data.thisMonthCents) : undefined },
    { label: "Last month", value: data ? cents(data.lastMonthCents) : undefined },
  ];

  const plans = ["starter", "growth", "scale"] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>

      {error && (
        <p className="text-sm" style={{ color: "#E24B4A" }}>Failed to load revenue data.</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {topMetrics.map((m) => (
          <Card key={m.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-8 w-20" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">{m.value ?? "—"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Revenue by plan</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => {
            const d = data?.byPlan[plan];
            return (
              <Card key={plan} className="shadow-none">
                <CardContent className="p-5">
                  <p className="text-sm font-medium capitalize">{plan}</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-6 w-full" />
                  ) : (
                    <>
                      <p className="mt-2 text-2xl font-semibold">{d ? cents(d.revenueCents) : "$0.00"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{d?.count ?? 0} purchases</p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent transactions</h2>
        <Card className="shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                (data?.recentTransactions ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(t.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.credits.toLocaleString()}</TableCell>
                    <TableCell>{cents(t.amountCents)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
