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
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const startTime = Date.now();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: renderedPrompt }],
    });
    const output =
      message.content[0].type === "text" ? message.content[0].text : "";
    res.json({
      output,
      model: message.model,
      provider: "anthropic",
      latencyMs: Date.now() - startTime,
      tokenCount: message.usage.input_tokens + message.usage.output_tokens,
      renderedPrompt,
    });
    return;
  }

  if (model === "gpt") {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const startTime = Date.now();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: renderedPrompt }],
    });
    const choice = completion.choices[0];
    res.json({
      output: choice.message.content ?? "",
      model: completion.model,
      provider: "openai",
      latencyMs: Date.now() - startTime,
      tokenCount: completion.usage?.total_tokens ?? 0,
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
