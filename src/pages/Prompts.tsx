import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
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

export default function Prompts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");

  const { data: prompts, isLoading } = usePrompts(search, envFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
        <Button onClick={() => console.log("New Prompt")} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="prod">Prod</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="dev">Dev</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (prompts ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No prompts found.
                </TableCell>
              </TableRow>
            ) : (
              (prompts ?? []).map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/prompts/${p.slug}`)}
                >
                  <TableCell className="font-mono text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-sm">v{p.latestVersion ?? "—"}</TableCell>
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
  );
}
