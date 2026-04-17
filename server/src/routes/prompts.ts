import { Router, Request, Response } from "express";
import { Environment, PromptStatus } from "@prisma/client";
import { requireAuthOrApiKey } from "../middleware/requireAuthOrApiKey";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuthOrApiKey);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const VALID_ENVIRONMENTS = Object.values(Environment);
const MUTABLE_STATUSES: PromptStatus[] = [PromptStatus.ACTIVE, PromptStatus.DRAFT];

// ─── GET /v1/prompts ─────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { search, environment } = req.query;

  if (environment && !VALID_ENVIRONMENTS.includes(environment as Environment)) {
    res.status(400).json({ error: `environment must be one of: ${VALID_ENVIRONMENTS.join(", ")}` });
    return;
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      userId: user.id,
      status: { not: PromptStatus.DELETED },
      ...(search
        ? {
            OR: [
              { name: { contains: String(search), mode: "insensitive" } },
              { slug: { contains: String(search), mode: "insensitive" } },
            ],
          }
        : {}),
      ...(environment ? { environment: environment as Environment } : {}),
    },
    include: {
      versions: {
        where: { isCurrent: true },
        take: 1,
        select: { version: true, template: true, savedAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Flatten current version fields onto the prompt object for the frontend
  const payload = prompts.map((p) => {
    const current = p.versions[0] ?? null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      environment: p.environment,
      status: p.status,
      latestVersion: current?.version ?? 0,
      template: current?.template ?? "",
      lastUpdated: current?.savedAt ?? p.updatedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  res.json(payload);
});

// ─── POST /v1/prompts ────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { name, environment, template, message } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!environment || !VALID_ENVIRONMENTS.includes(environment as Environment)) {
    res.status(400).json({ error: `environment must be one of: ${VALID_ENVIRONMENTS.join(", ")}` });
    return;
  }
  if (!template || typeof template !== "string" || template.trim().length === 0) {
    res.status(400).json({ error: "template is required" });
    return;
  }

  const slug = slugify(name);
  if (slug.length === 0) {
    res.status(400).json({ error: "name must produce a valid URL slug" });
    return;
  }

  const existing = await prisma.prompt.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });
  if (existing) {
    res.status(409).json({ error: `A prompt with slug "${slug}" already exists` });
    return;
  }

  // Create Prompt + first PromptVersion atomically
  const prompt = await prisma.$transaction(async (tx) => {
    const created = await tx.prompt.create({
      data: {
        userId: user.id,
        name: name.trim(),
        slug,
        environment: environment as Environment,
        status: PromptStatus.DRAFT,
      },
    });

    const firstVersion = await tx.promptVersion.create({
      data: {
        promptId: created.id,
        version: 1,
        template,
        message: message ?? "Initial version",
        isCurrent: true,
        diff: template.split("\n").map((line) => `+ ${line}`),
      },
    });

    return { ...created, versions: [firstVersion] };
  });

  res.status(201).json(prompt);
});

// ─── GET /v1/prompts/:slug ───────────────────────────────────────────────────

router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { slug } = req.params;

  const prompt = await prisma.prompt.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
    include: {
      versions: { orderBy: { version: "desc" } },
    },
  });

  if (!prompt || prompt.status === PromptStatus.DELETED) {
    res.status(404).json({ error: `Prompt "${slug}" not found` });
    return;
  }

  res.json(prompt);
});

// ─── PUT /v1/prompts/:slug ───────────────────────────────────────────────────

router.put("/:slug", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { slug } = req.params;
  const { name, environment, status } = req.body ?? {};

  const prompt = await prisma.prompt.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (!prompt || prompt.status === PromptStatus.DELETED) {
    res.status(404).json({ error: `Prompt "${slug}" not found` });
    return;
  }

  // Validate any provided fields
  if (environment !== undefined && !VALID_ENVIRONMENTS.includes(environment as Environment)) {
    res.status(400).json({ error: `environment must be one of: ${VALID_ENVIRONMENTS.join(", ")}` });
    return;
  }
  if (status !== undefined && !MUTABLE_STATUSES.includes(status as PromptStatus)) {
    res.status(400).json({ error: `status must be one of: ${MUTABLE_STATUSES.join(", ")}` });
    return;
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(environment !== undefined ? { environment: environment as Environment } : {}),
      ...(status !== undefined ? { status: status as PromptStatus } : {}),
    },
    include: {
      versions: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  res.json(updated);
});

// ─── DELETE /v1/prompts/:slug ────────────────────────────────────────────────

router.delete("/:slug", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { slug } = req.params;

  const prompt = await prisma.prompt.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (!prompt || prompt.status === PromptStatus.DELETED) {
    res.status(404).json({ error: `Prompt "${slug}" not found` });
    return;
  }

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { status: PromptStatus.DELETED },
  });

  res.status(204).send();
});

export default router;
