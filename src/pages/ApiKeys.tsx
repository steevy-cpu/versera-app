import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/use-toast";

export default function ApiKeys() {
  const { toast } = useToast();
  const { data: keys, isLoading } = useApiKeys();
  const { mutate: createKey, isPending: isCreating } = useCreateApiKey();
  const { mutate: revokeKey, isPending: isRevoking } = useRevokeApiKey();

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<{ id: string; fullKey: string } | null>(null);

  const handleGenerate = () => {
    const name = newKeyName.trim() || "API Key";
    createKey(
      { name },
      {
        onSuccess: (data) => {
          setJustCreated({ id: data.id, fullKey: data.fullKey });
          setNewKeyName("");
          toast({ title: "API key generated — copy it now, it won't be shown again." });
        },
        onError: (err) =>
          toast({
            title: "Failed to generate key",
            description: (err as { message: string }).message,
            variant: "destructive",
          }),
      }
    );
  };

  const handleRevoke = (id: string) => {
    revokeKey(id, {
      onSuccess: () => {
        if (justCreated?.id === id) setJustCreated(null);
        toast({ title: "API key revoked" });
      },
      onError: (err) =>
        toast({
          title: "Failed to revoke key",
          description: (err as { message: string }).message,
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (keys ?? []).length === 0 && !justCreated ? (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      ) : (
        <div className="space-y-4">
          {(keys ?? []).map((key) => {
            const isRevealed = revealedId === key.id;
            const fullKey = justCreated?.id === key.id ? justCreated.fullKey : null;
            const displayKey = isRevealed && fullKey ? fullKey : key.keyPrefix;

            return (
              <Card key={key.id} className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">{key.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.5">
                    <code className="flex-1 font-mono text-sm truncate">{displayKey}</code>
                    {fullKey && (
                      <button
                        onClick={() => setRevealedId(isRevealed ? null : key.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title={isRevealed ? "Hide" : "Reveal"}
                      >
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                    {fullKey && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(fullKey);
                          toast({ title: "Key copied" });
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>
                      Created:{" "}
                      {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                    </span>
                    {key.lastUsedAt && (
                      <span>
                        Last used:{" "}
                        {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRevoking}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevoke(key.id)}
                  >
                    Revoke
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <Input
          placeholder="Key name (e.g. Production Key)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <Button variant="outline" onClick={handleGenerate} disabled={isCreating}>
          {isCreating ? "Generating…" : "Generate New Key"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Your API key is shown once. Store it securely.
      </p>
    </div>
  );
}
