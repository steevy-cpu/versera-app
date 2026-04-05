import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useStats } from "@/hooks/useAuth";
import { usePrompts } from "@/hooks/usePrompts";

function envColor(env: string) {
  switch (env) {
    case "prod": return "bg-env-prod/15 text-env-prod border-0";
    case "staging": return "bg-env-staging/15 text-env-staging border-0";
    default: return "bg-env-dev/15 text-env-dev border-0";
  }
}

function statusColor(status: string) {
  return status === "ACTIVE" || status === "Active"
    ? "bg-env-prod/15 text-env-prod border-0"
    : "bg-muted text-muted-foreground border-0";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: prompts, isLoading: promptsLoading } = usePrompts();

  const metricCards = [
    { label: "Total Prompts", value: stats?.totalPrompts },
    { label: "API Calls Today", value: stats?.apiCallsToday },
    { label: "Credits Remaining", value: stats?.creditsRemaining },
    { label: "Active Versions", value: stats?.activeVersions },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate("/prompts")} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
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
        <h2 className="mb-4 text-lg font-semibold">Recent Prompts</h2>
        <Card className="shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Latest Version</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promptsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                (prompts ?? []).map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/prompts/${p.slug}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {p.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      v{p.latestVersion ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={envColor(p.environment)}>
                        {p.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColor(p.status)}>
                        {p.status === "ACTIVE" ? "Active" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.lastUpdated
                        ? formatDistanceToNow(new Date(p.lastUpdated), { addSuffix: true })
                        : formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                    </TableCell>
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
