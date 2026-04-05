import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { promptVersions } from "@/mock/prompts";

export default function Versions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/prompts" className="hover:text-foreground">Prompts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/prompts/summarize-doc" className="hover:text-foreground">summarize-doc</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Versions</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Version History — summarize-doc
      </h1>

      <div className="space-y-4">
        {promptVersions.map((v) => (
          <div
            key={v.version}
            className="rounded-lg border p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">v{v.version}</span>
                {v.isCurrent && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                    Current
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">{v.savedAt}</span>
              </div>
              {!v.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log(`Rollback to v${v.version}`)}
                >
                  Rollback
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{v.message}</p>

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
          </div>
        ))}
      </div>
    </div>
  );
}
