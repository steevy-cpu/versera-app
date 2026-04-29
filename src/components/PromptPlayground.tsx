import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLLMKeys, type LLMProvider } from "@/hooks/useLLMKeys";
import {
  useDeleteDraft,
  useDraft,
  usePlaygroundRun,
  useSaveDraft,
} from "@/hooks/usePlayground";
import { useSaveVersion } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";

const models = [
  {
    label: "Gemini 2.5 Flash (free, default)",
    value: "gemini-2.5-flash",
    provider: "gemini" as LLMProvider,
    byok: false,
  },
  {
    label: "Claude Sonnet 4.6 (BYOK)",
    value: "claude-sonnet-4.6",
    provider: "anthropic" as LLMProvider,
    byok: true,
  },
  {
    label: "Claude Haiku 4.5 (BYOK)",
    value: "claude-haiku-4.5",
    provider: "anthropic" as LLMProvider,
    byok: true,
  },
  {
    label: "GPT-5 (BYOK)",
    value: "gpt-5",
    provider: "openai" as LLMProvider,
    byok: true,
  },
  {
    label: "Groq Llama 3.3 70B (BYOK)",
    value: "groq-llama-3.3-70b",
    provider: "groq" as LLMProvider,
    byok: true,
  },
];

function parseVariables(template: string) {
  const matches = template.match(/{{\s*([\w. -]+)\s*}}/g);
  if (!matches) return [];

  return [
    ...new Set(
      matches.map((match) => match.replace(/[{}]/g, "").trim()).filter(Boolean)
    ),
  ];
}

function isProviderConnected(
  keys: unknown,
  provider: LLMProvider
) {
  if (!Array.isArray(keys)) return false;

  return keys.some((key) => {
    if (typeof key === "string") return key === provider;
    if (!key || typeof key !== "object") return false;
    const item = key as { provider?: string; connected?: boolean };
    return item.provider === provider && item.connected !== false;
  });
}

export function PromptPlayground({
  promptId,
  slug,
  template,
  onTemplateChange,
  onClose,
}: {
  promptId: string;
  slug: string;
  template: string;
  onTemplateChange: (template: string) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: keys } = useLLMKeys();
  const { data: draft, isFetched: draftFetched } = useDraft(promptId);
  const { mutate: runTest, isPending: isRunning } = usePlaygroundRun();
  const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();
  const { mutate: deleteDraft } = useDeleteDraft();
  const { mutate: saveVersion, isPending: isSavingVersion } = useSaveVersion();

  const [model, setModel] = useState("gemini-2.5-flash");
  const [values, setValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ tokens?: number; seconds?: number; model: string } | null>(null);
  const [showCommit, setShowCommit] = useState(false);
  const [message, setMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const hydrated = useRef(false);
  const lastSavedTemplate = useRef<string | null>(null);

  const selectedModel = models.find((item) => item.value === model) ?? models[0];
  const providerMissing =
    selectedModel.byok && !isProviderConnected(keys, selectedModel.provider);
  const variables = useMemo(() => parseVariables(template), [template]);

  useEffect(() => {
    if (!draftFetched || hydrated.current) return;
    hydrated.current = true;
    lastSavedTemplate.current = draft?.template ?? template;
    if (draft?.template) onTemplateChange(draft.template);
  }, [draft?.template, draftFetched, onTemplateChange, template]);

  useEffect(() => {
    setValues((current) => {
      const next: Record<string, string> = {};
      variables.forEach((variable) => {
        next[variable] = current[variable] ?? "";
      });
      return next;
    });
  }, [variables]);

  useEffect(() => {
    if (!draftFetched || !hydrated.current) return;
    if (template === lastSavedTemplate.current) return;

    const timer = window.setTimeout(() => {
      saveDraft(
        { promptId, template },
        {
          onSuccess: () => {
            lastSavedTemplate.current = template;
            setSavedAt(new Date());
          },
        }
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [draftFetched, promptId, saveDraft, template]);

  const handleRun = () => {
    setError("");
    runTest(
      { promptId, template, variables: values, model },
      {
        onSuccess: (result) => {
          setOutput(result.output);
          setStats({
            tokens: result.tokens,
            seconds:
              result.durationSeconds ??
              (result.durationMs ? result.durationMs / 1000 : undefined),
            model: result.model ?? model,
          });
        },
        onError: (err) => {
          setError((err as { message?: string }).message ?? "Run failed");
        },
      }
    );
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Output copied" });
  };

  const handleSaveVersion = () => {
    saveVersion(
      {
        slug,
        template,
        message: message.trim() || "Tested in playground",
      },
      {
        onSuccess: () => {
          deleteDraft(promptId);
          toast({ title: "Version saved" });
          onClose();
        },
        onError: (err) => {
          setError((err as { message?: string }).message ?? "Save failed");
        },
      }
    );
  };

  const statLine = [
    stats?.tokens !== undefined ? `${stats.tokens} tokens` : null,
    stats?.seconds !== undefined ? `${stats.seconds.toFixed(1)}s` : null,
    stats?.model,
  ].filter(Boolean).join(" · ");

  return (
    <aside className="flex h-fit min-h-[640px] flex-col rounded-lg border border-[#e5e7eb] bg-[#ffffff] shadow-sm dark:border-[#1f2937] dark:bg-[#111111]">
      <div className="flex items-start justify-between border-b border-[#e5e7eb] p-5 dark:border-[#1f2937]">
        <div>
          <h2 className="text-base font-semibold">Test prompt</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafts auto-save. Test runs are free.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close playground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {providerMissing && (
            <p className="text-xs text-muted-foreground">
              Add your API key in Settings to use this model{" "}
              <Link to="/settings" className="font-medium text-primary hover:underline">
                Settings →
              </Link>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Variables</h3>
          {variables.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No variables detected
            </p>
          ) : (
            <div className="space-y-2">
              {variables.map((variable) => (
                <div key={variable} className="flex items-center gap-3">
                  <code className="w-28 shrink-0 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                    {variable}
                  </code>
                  <Input
                    value={values[variable] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [variable]: event.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                    placeholder="Value"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleRun}
          disabled={isRunning || providerMissing}
          className="w-full bg-[#10b981] text-white hover:bg-[#0ea371]"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            "Run test"
          )}
        </Button>

        <div className="space-y-3">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleRun}
                disabled={isRunning || providerMissing}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-[#e5e7eb] dark:border-[#1f2937]">
              <div className="max-h-[300px] min-h-[160px] overflow-auto p-4 font-mono text-sm leading-relaxed">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="font-sans text-sm text-muted-foreground">
                    Click 'Run test' to see the LLM response
                  </p>
                )}
              </div>
              {output && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7eb] px-4 py-3 dark:border-[#1f2937]">
                  <p className="text-xs text-muted-foreground">{statLine}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={copyOutput}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy output
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRun}
                      disabled={isRunning || providerMissing}
                    >
                      Run again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-md border border-[#e5e7eb] p-4 dark:border-[#1f2937]">
          <p className="text-sm font-medium">Happy with this version?</p>
          {showCommit && (
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Commit message (optional)"
              className="text-sm"
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => (showCommit ? handleSaveVersion() : setShowCommit(true))}
              disabled={isSavingVersion}
              className="bg-[#10b981] text-white hover:bg-[#0ea371]"
            >
              {isSavingVersion ? "Saving..." : "Save as new version"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Keep editing
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] px-5 py-3 text-xs text-muted-foreground dark:border-[#1f2937]">
        {isSavingDraft
          ? "Saving..."
          : savedAt
            ? "Draft saved · just now"
            : draftFetched
              ? "Draft ready"
              : "Loading draft..."}
      </div>
    </aside>
  );
}
