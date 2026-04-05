import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { usePrompt, useSaveVersion } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";

const envTabs = ["dev", "staging", "prod"] as const;

function HighlightedTemplate({ text }: { text: string }) {
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-editor-foreground">
      {parts.map((part, i) =>
        part.startsWith("{{") ? (
          <span key={i} className="text-primary font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </pre>
  );
}

export default function PromptEditor() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: prompt, isLoading } = usePrompt(slug);
  const { mutate: saveVersion, isPending: isSaving } = useSaveVersion();

  const currentVersion = prompt?.versions?.find((v) => v.isCurrent);

  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");

  // Populate template when prompt loads
  useEffect(() => {
    if (currentVersion) setTemplate(currentVersion.template);
  }, [currentVersion?.id]);

  const variables = useMemo(() => {
    const matches = template.match(/{{(\w+)}}/g);
    return matches ? [...new Set(matches)] : [];
  }, [template]);

  const handleSave = () => {
    if (!slug) return;
    saveVersion(
      { slug, template, message: message.trim() || "Updated template" },
      {
        onSuccess: () => {
          toast({ title: "Version saved" });
          setMessage("");
        },
        onError: (err) => {
          toast({ title: "Save failed", description: (err as { message: string }).message, variant: "destructive" });
        },
      }
    );
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(`GET /v1/resolve/${slug}`);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3"><Skeleton className="h-64 w-full" /></div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!prompt) return <p className="text-muted-foreground">Prompt not found.</p>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/prompts" className="hover:text-foreground">Prompts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{prompt.name}</span>
      </div>

      {/* Env tabs — active tab reflects the prompt's real environment */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {envTabs.map((env) => (
          <button
            key={env}
            disabled={env !== prompt.environment}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              env === prompt.environment
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground opacity-40 cursor-not-allowed"
            }`}
          >
            {env}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Editor — 3/5 */}
        <div className="lg:col-span-3 space-y-3">
          <label className="text-sm font-medium">Prompt Template</label>
          <div className="relative">
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full min-h-[300px] rounded-lg bg-editor p-5 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring text-transparent caret-editor-foreground selection:bg-white/20"
              spellCheck={false}
            />
            <div
              className="absolute inset-0 pointer-events-none rounded-lg p-5 overflow-auto"
              aria-hidden
            >
              <HighlightedTemplate text={template} />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              placeholder="Commit message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="max-w-xs text-sm"
            />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save as new version"}
            </Button>
          </div>
        </div>

        {/* Metadata — 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Version</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">v{currentVersion?.version ?? "—"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentVersion?.savedAt
                  ? new Date(currentVersion.savedAt).toLocaleString()
                  : "—"}
              </p>
              <button
                onClick={() => navigate(`/prompts/${slug}/versions`)}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                View history
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detected Variables</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {variables.length === 0 ? (
                <p className="text-xs text-muted-foreground">No variables detected</p>
              ) : (
                variables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 border font-mono text-xs"
                  >
                    {v}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Resolve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <code className="font-mono text-xs">
                  GET /v1/resolve/{prompt.slug}
                </code>
                <button onClick={copySnippet} className="ml-2 text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
