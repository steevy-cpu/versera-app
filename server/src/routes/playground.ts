import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../lib/prisma";
import { runWithGemini } from "../lib/gemini";
import { decrypt } from "../lib/encryption";

const router = Router();

router.use(requireAuth);

// ─── POST /v1/playground/run ─────────────────────────────────────────────────

router.post("/run", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    template,
    variables = {},
    model = "gemini",
  } = req.body as {
    template: string;
    variables?: Record<string, string>;
    model?: "gemini" | "claude" | "gpt";
  };

  if (!template || typeof template !== "string") {
    res.status(400).json({ error: "template is required" });
    return;
  }

  // Inject variables into template
  const renderedPrompt = template.replace(/{{(\w+)}}/g, (_match, key) => {
    return typeof variables[key] === "string" ? variables[key] : `{{${key}}}`;
  });

  if (model === "gemini") {
    const result = await runWithGemini(renderedPrompt);
    res.json({ ...result, renderedPrompt });
    return;
  }

  // claude / gpt: look up user's stored BYOK key for the provider
  const providerMap: Record<string, string> = {
    claude: "anthropic",
    gpt: "openai",
  };
  const provider = providerMap[model];

  const stored = await prisma.userLlmKey.findFirst({
    where: { userId: user.id, provider },
  });

  if (!stored) {
    res.status(400).json({
      error: `No ${provider} API key stored. Add one via PUT /v1/me/llm-keys.`,
    });
    return;
  }

  // Decrypt the stored key and call the provider
  const apiKey = decrypt(stored.keyHash);

  if (model === "claude") {
    const startTime = Date.now();
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: renderedPrompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      res.status(502).json({ error: "Anthropic API error", detail: err });
      return;
    }
    const data = (await resp.json()) as {
      model: string;
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    const output = data.content[0]?.text ?? "";
    res.json({
      output,
      model: data.model,
      provider: "anthropic",
      latencyMs: Date.now() - startTime,
      tokenCount: data.usage.input_tokens + data.usage.output_tokens,
      renderedPrompt,
    });
    return;
  }

  if (model === "gpt") {
    const startTime = Date.now();
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: renderedPrompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      res.status(502).json({ error: "OpenAI API error", detail: err });
      return;
    }
    const data = (await resp.json()) as {
      model: string;
      choices: { message: { content: string } }[];
      usage: { total_tokens: number };
    };
    res.json({
      output: data.choices[0]?.message.content ?? "",
      model: data.model,
      provider: "openai",
      latencyMs: Date.now() - startTime,
      tokenCount: data.usage?.total_tokens ?? 0,
      renderedPrompt,
    });
    return;
  }

  res.status(400).json({ error: `Unknown model: ${model}` });
});

// ─── POST /v1/playground/draft ───────────────────────────────────────────────

router.post("/draft", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { promptId, template } = req.body as {
    promptId: string;
    template: string;
  };

  if (!promptId || !template) {
    res.status(400).json({ error: "promptId and template are required" });
    return;
  }

  // Verify the prompt belongs to this user
  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, userId: user.id },
  });
  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const draft = await prisma.promptDraft.upsert({
    where: { userId_promptId: { userId: user.id, promptId } },
    create: { userId: user.id, promptId, template },
    update: { template },
  });

  res.json(draft);
});

// ─── GET /v1/playground/draft/:promptId ──────────────────────────────────────

router.get(
  "/draft/:promptId",
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { promptId } = req.params;

    const draft = await prisma.promptDraft.findUnique({
      where: { userId_promptId: { userId: user.id, promptId } },
    });

    res.json(draft ?? null);
  }
);

// ─── DELETE /v1/playground/draft/:promptId ───────────────────────────────────

router.delete(
  "/draft/:promptId",
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { promptId } = req.params;

    await prisma.promptDraft.deleteMany({
      where: { userId: user.id, promptId },
    });

    res.status(204).send();
  }
);

export default router;
