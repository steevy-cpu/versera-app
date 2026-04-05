import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { useMe, useUsage } from "@/hooks/useAuth";
import { usePlans, useTransactions, useCheckout } from "@/hooks/useBilling";
import { toast } from "sonner";

export default function Billing() {
  const [searchParams] = useSearchParams();
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useMe();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const { mutate: checkout } = useCheckout();

  const isSuccess = searchParams.get("success") === "true";
  const isCancelled = searchParams.get("cancelled") === "true";

  // Refresh data when returning from successful checkout
  if (isSuccess) {
    refetchUser();
    refetchTx();
  }

  const usagePercent =
    user ? (user.credits / Math.max(user.totalCredits, 1)) * 100 : 0;

  const usageCards = [
    { label: "Resolve calls", value: usage?.resolveCalls },
    { label: "A/B assignments", value: usage?.abAssignments },
    { label: "Logs submitted", value: usage?.logsSubmitted },
  ];

  const handleBuy = (planKey: string) => {
    setBuyingPlan(planKey);
    checkout(planKey, {
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      },
      onError: (err) => {
        setBuyingPlan(null);
        toast.error("Checkout failed", {
          description: (err as { message: string }).message,
        });
      },
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Billing & Credits</h1>

      {/* Credit balance */}
      <Card className="shadow-none">
        <CardContent className="p-6 space-y-3">
          {userLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <p className="text-4xl font-bold">
              {user?.credits.toLocaleString() ?? "—"} credits
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Resets never — credits never expire
          </p>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {user?.credits.toLocaleString() ?? "—"} of{" "}
            {user?.totalCredits.toLocaleString() ?? "—"} remaining
          </p>
        </CardContent>
      </Card>

      {/* Usage stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {usageCards.map((u) => (
          <Card key={u.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{u.label}</p>
              {usageLoading ? (
                <Skeleton className="mt-1 h-8 w-16" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">
                  {u.value?.toLocaleString() ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buy Credits */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Buy Credits</h2>
        {plansLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(plans ?? []).map((plan) => (
              <Card
                key={plan.key}
                className={`shadow-none ${
                  plan.featured ? "border-primary ring-1 ring-primary" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-3xl font-bold">${plan.price}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.credits.toLocaleString()} credits
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <Button
                    variant={plan.featured ? "default" : "outline"}
                    className="w-full"
                    disabled={isCheckingOut}
                    onClick={() => handleBuy(plan.key)}
                  >
                    Buy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Transaction History</h2>
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
              {txLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (transactions ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                (transactions ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell className={`text-sm font-mono ${t.credits > 0 ? "text-env-prod" : "text-muted-foreground"}`}>
                      {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.amountCents > 0 ? `$${(t.amountCents / 100).toFixed(2)}` : "—"}
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
