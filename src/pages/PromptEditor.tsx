import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronRight } from "lucide-react";
import { prompts } from "@/mock/prompts";

const envTabs = ["dev", "staging", "prod"] as const;

function HighlightedTemplate({ text }: { text: string }) {
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-editor-foreground">
      {parts.map((part, i) =>
        part.startsWith("{{") ? (
          <span key={i} className="text-amber font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </pre>
  );
}

export default function PromptEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const prompt = prompts.find((p) => p.id === id) ?? prompts[0];
  const [activeEnv, setActiveEnv] = useState(prompt.environment);
  const [template, setTemplate] = useState(prompt.template);

  const variables = useMemo(() => {
    const matches = template.match(/{{(\w+)}}/g);
    return matches ? [...new Set(matches)] : [];
  }, [template]);

  const copySnippet = () => {
    navigator.clipboard.writeText(`GET /v1/resolve/${prompt.name}`);
    console.log("Copied API snippet");
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/prompts" className="hover:text-foreground">Prompts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{prompt.name}</span>
      </div>

      {/* Env tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {envTabs.map((env) => (
          <button
            key={env}
            onClick={() => setActiveEnv(env)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              activeEnv === env
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
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
              className="w-full min-h-[300px] rounded-lg bg-editor p-5 font-mono text-sm text-editor-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
            {/* Overlay for highlighting — displayed on top, pointer-events none */}
            <div
              className="absolute inset-0 pointer-events-none rounded-lg p-5 overflow-hidden"
              aria-hidden
            >
              <HighlightedTemplate text={template} />
            </div>
          </div>
          <Button onClick={() => console.log("Save as new version")}>
            Save as new version
          </Button>
        </div>

        {/* Metadata — 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Version</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">v{prompt.latestVersion}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Saved {prompt.lastUpdated}
              </p>
              <button
                onClick={() => navigate(`/prompts/${prompt.id}/versions`)}
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
              {variables.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="bg-amber/15 text-amber border-0 font-mono text-xs"
                >
                  {v}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Resolve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <code className="font-mono text-xs">
                  GET /v1/resolve/{prompt.name}
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
