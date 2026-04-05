import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdminUserDetail } from "@/hooks/useAdmin";

function cents(v: number) {
  return `$${(v / 100).toFixed(2)}`;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useAdminUserDetail(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-none"><CardContent className="p-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return <p className="text-sm" style={{ color: "#E24B4A" }}>User not found.</p>;
  }

  const totalSpent = user.transactions.reduce((s, t) => s + t.amountCents, 0);

  const accountMetrics = [
    { label: "Credits remaining", value: user.credits.toLocaleString() },
    { label: "Total credits purchased", value: user.totalCredits.toLocaleString() },
    { label: "Total spent", value: cents(totalSpent) },
    { label: "Prompts created", value: user.prompts.length.toString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {/* Account details */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Account details</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {accountMetrics.map((m) => (
            <Card key={m.label} className="shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Prompts</h2>
        <Card className="shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.prompts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No prompts</TableCell></TableRow>
              ) : (
                user.prompts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium font-mono text-sm">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="border-0">{p.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="border-0">{p.status}</Badge>
                    </TableCell>
                    <TableCell>{p._count.versions}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Transaction history</h2>
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
              {user.transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>
              ) : (
                user.transactions.map((t) => (
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

      {/* API Keys */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">API Keys</h2>
        <Card className="shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.apiKeys.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No API keys</TableCell></TableRow>
              ) : (
                user.apiKeys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-sm">{k.keyPrefix}…</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(k.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {k.lastUsedAt ? format(new Date(k.lastUsedAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-0 ${k.revokedAt ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {k.revokedAt ? "Revoked" : "Active"}
                      </Badge>
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
