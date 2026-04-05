import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eye, EyeOff } from "lucide-react";
import { apiKeys } from "@/mock/user";

export default function ApiKeys() {
  const [revealed, setRevealed] = useState(false);
  const key = apiKeys[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{key.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.5">
            <code className="flex-1 font-mono text-sm truncate">
              {revealed ? key.fullKey : key.key}
            </code>
            <button
              onClick={() => setRevealed(!revealed)}
              className="text-muted-foreground hover:text-foreground"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(key.fullKey);
                console.log("Key copied");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Created: {key.created}</span>
            <span>Last used: {key.lastUsed}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => console.log("Revoke key")}
          >
            Revoke
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => console.log("Generate new key")}>
        Generate New Key
      </Button>

      <p className="text-xs text-muted-foreground">
        Your API key is shown once. Store it securely.
      </p>
    </div>
  );
}
