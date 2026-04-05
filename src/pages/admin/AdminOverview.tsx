import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminStats, useAdminUsers } from "@/hooks/useAdmin";

function cents(v: number) {
  return `$${(v / 100).toFixed(2)}`;
}

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(1, 10);
  const navigate = useNavigate();

  const metrics = [
    { label: "Total users", value: stats?.totalUsers },
    { label: "Total prompts", value: stats?.totalPrompts },
    { label: "Total resolves", value: stats?.totalResolves },
    { label: "Total revenue", value: stats ? cents(stats.totalRevenueCents) : undefined },
  ];

  const metrics2 = [
    { label: "New users today", value: stats?.newUsersToday },
    { label: "New users this week", value: stats?.newUsersThisWeek },
    { label: "Active users this week", value: stats?.activeUsersThisWeek },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last updated: {format(new Date(), "PPpp")}
        </p>
      </div>

      {statsError && (
        <p className="text-sm" style={{ color: "#E24B4A" }}>Failed to load stats. Make sure you have admin access.</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-8 w-20" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">
                  {m.value?.toLocaleString() ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics2.map((m) => (
          <Card key={m.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-8 w-20" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">
                  {m.value?.toLocaleString() ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
        <Card className="shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Prompts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                (usersData?.users ?? []).map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{u.credits.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{u.promptCount}</TableCell>
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
