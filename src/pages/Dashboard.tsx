import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getUser } from "@/lib/auth";
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
import { useStats, useUsage } from "@/hooks/useAuth";
import { usePrompts } from "@/hooks/usePrompts";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import OnboardingModal, { ONBOARDING_KEY } from "@/components/OnboardingModal";

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
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: prompts, isLoading: promptsLoading } = usePrompts();
  const user = getUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (
      !promptsLoading &&
      prompts &&
      prompts.length === 0 &&
      !localStorage.getItem(ONBOARDING_KEY)
    ) {
      setShowOnboarding(true);
    }
  }, [prompts, promptsLoading]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const metricCards = [
    { label: "Total Prompts", value: stats?.totalPrompts },
    { label: "API Calls Today", value: stats?.apiCallsToday },
    { label: "Credits Remaining", value: stats?.creditsRemaining },
    { label: "Active Versions", value: stats?.activeVersions },
  ];

  return (
    <div className="space-y-8">
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {user?.name ?? "there"}
        </h1>
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
        <Card className="shadow-none overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Latest Version</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
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
                    <TableCell className="font-mono text-sm hidden sm:table-cell">
                      v{p.latestVersion ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={envColor(p.environment)}>
                        {p.environment}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={statusColor(p.status)}>
                        {p.status === "ACTIVE" ? "Active" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
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
