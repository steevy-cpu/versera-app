import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { user, usageStats } from "@/mock/user";
import { plans, transactions } from "@/mock/billing";

const usageCards = [
  { label: "Resolve calls", value: usageStats.resolveCalls.toLocaleString() },
  { label: "A/B assignments", value: usageStats.abAssignments.toLocaleString() },
  { label: "Logs submitted", value: usageStats.logsSubmitted.toLocaleString() },
];

export default function Billing() {
  const usagePercent = (user.credits / user.totalCredits) * 100;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Billing & Credits</h1>

      {/* Credit balance */}
      <Card className="shadow-none">
        <CardContent className="p-6 space-y-3">
          <p className="text-4xl font-bold">{user.credits.toLocaleString()} credits</p>
          <p className="text-sm text-muted-foreground">
            Resets never — credits never expire
          </p>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {user.credits.toLocaleString()} of {user.totalCredits.toLocaleString()} remaining
          </p>
        </CardContent>
      </Card>

      {/* Usage stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {usageCards.map((u) => (
          <Card key={u.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{u.label}</p>
              <p className="mt-1 text-2xl font-semibold">{u.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Buy Credits */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
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
                  onClick={() => console.log(`Buy ${plan.name}`)}
                >
                  Buy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
              {transactions.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{t.date}</TableCell>
                  <TableCell className="text-sm">{t.description}</TableCell>
                  <TableCell className="text-sm font-mono text-env-prod">
                    {t.credits}
                  </TableCell>
                  <TableCell className="text-sm">{t.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
