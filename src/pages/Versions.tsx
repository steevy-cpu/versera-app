import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { usePrompt, useRollback } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";

export default function Versions() {
  const { id: slug } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: prompt, isLoading } = usePrompt(slug);
  const { mutate: rollback, isPending: isRollingBack } = useRollback();

  const versions = prompt?.versions ?? [];

  const handleRollback = (version: number) => {
    if (!slug) return;
    rollback(
      { slug, version },
      {
        onSuccess: () => toast({ title: `Rolled back to v${version}` }),
        onError: (err) =>
          toast({
            title: "Rollback failed",
            description: (err as { message: string }).message,
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/prompts" className="hover:text-foreground">Prompts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/prompts/${slug}`} className="hover:text-foreground">{slug}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Versions</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Version History — {slug}
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <p className="text-muted-foreground">No versions yet.</p>
      ) : (
        <div className="space-y-4">
          {versions.map((v) => (
            <div key={v.id} className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">v{v.version}</span>
                  {v.isCurrent && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                      Current
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(v.savedAt), { addSuffix: true })}
                  </span>
                </div>
                {!v.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRollingBack}
                    onClick={() => handleRollback(v.version)}
                  >
                    Rollback
                  </Button>
                )}
              </div>

              {v.message && (
                <p className="text-sm text-muted-foreground">{v.message}</p>
              )}

              {v.diff.length > 0 && (
                <div className="rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                  {v.diff.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith("+")
                          ? "text-env-prod"
                          : line.startsWith("-")
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
