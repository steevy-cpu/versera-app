import { Router, Request, Response } from "express";
import { PromptStatus } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth);

// ─── Diff helper ─────────────────────────────────────────────────────────────
//
// Simple line-by-line diff. Produces lines prefixed with:
//   "- " removed from previous version
//   "+ " added in new version
//   "  " unchanged context
//
// Limitation: positional comparison (no LCS). Works correctly for in-place
// edits; insertion/deletion in the middle will appear as paired - / + pairs.
// Good enough for prompt templates at MVP scale.

function generateDiff(prev: string, next: string): string[] {
  if (!prev) {
    // First version — every line is an addition
    return next.split("\n").map((line) => `+ ${line}`);
  }

  const prevLines = prev.split("\n");
  const nextLines = next.split("\n");
  const maxLen = Math.max(prevLines.length, nextLines.length);
  const diff: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const p = prevLines[i];
    const n = nextLines[i];

    if (p === undefined) {
      diff.push(`+ ${n}`);
    } else if (n === undefined) {
      diff.push(`- ${p}`);
    } else if (p !== n) {
      diff.push(`- ${p}`);
      diff.push(`+ ${n}`);
    } else {
      diff.push(`  ${p}`);
    }
  }

  return diff;
}

// ─── Shared prompt ownership guard ───────────────────────────────────────────

async function findOwnedPrompt(userId: string, slug: string) {
  const prompt = await prisma.prompt.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (!prompt || prompt.status === PromptStatus.DELETED) return null;
  return prompt;
}

// ─── GET /v1/prompts/:slug/versions ──────────────────────────────────────────

router.get("/:slug/versions", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { slug } = req.params;

  const prompt = await findOwnedPrompt(user.id, slug);
  if (!prompt) {
    res.status(404).json({ error: `Prompt "${slug}" not found` });
    return;
  }

  const versions = await prisma.promptVersion.findMany({
    where: { promptId: prompt.id },
    orderBy: { version: "desc" },
  });

  res.json(versions);
});

// ─── POST /v1/prompts/:slug/versions ─────────────────────────────────────────

router.post("/:slug/versions", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { slug } = req.params;
  const { template, message } = req.body ?? {};

  if (!template || typeof template !== "string" || template.trim().length === 0) {
    res.status(400).json({ error: "template is required" });
    return;
  }

  const prompt = await findOwnedPrompt(user.id, slug);
  if (!prompt) {
    res.status(404).json({ error: `Prompt "${slug}" not found` });
    return;
  }

  const newVersion = await prisma.$transaction(async (tx) => {
    // Determine next version number and grab current template for diff
    const [aggregate, currentVersion] = await Promise.all([
      tx.promptVersion.aggregate({
        where: { promptId: prompt.id },
        _max: { version: true },
      }),
      tx.promptVersion.findFirst({
        where: { promptId: prompt.id, isCurrent: true },
        select: { template: true },
      }),
    ]);

    const nextVersion = (aggregate._max.version ?? 0) + 1;
    const diff = generateDiff(currentVersion?.template ?? "", template);

    // Demote all existing current versions
    await tx.promptVersion.updateMany({
      where: { promptId: prompt.id, isCurrent: true },
      data: { isCurrent: false },
    });

    // Create the new version
    const created = await tx.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: nextVersion,
        template,
        message: message ?? "",
        isCurrent: true,
        diff,
      },
    });

    // Bump prompt.updatedAt so list ordering stays correct
    await tx.prompt.update({
      where: { id: prompt.id },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  res.status(201).json(newVersion);
});

// ─── POST /v1/prompts/:slug/versions/:version/rollback ───────────────────────

router.post(
  "/:slug/versions/:version/rollback",
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { slug, version } = req.params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber) || versionNumber < 1) {
      res.status(400).json({ error: "version must be a positive integer" });
      return;
    }

    const prompt = await findOwnedPrompt(user.id, slug);
    if (!prompt) {
      res.status(404).json({ error: `Prompt "${slug}" not found` });
      return;
    }

    const target = await prisma.promptVersion.findUnique({
      where: { promptId_version: { promptId: prompt.id, version: versionNumber } },
    });

    if (!target) {
      res.status(404).json({ error: `Version ${versionNumber} not found for prompt "${slug}"` });
      return;
    }

    if (target.isCurrent) {
      res.status(400).json({ error: `Version ${versionNumber} is already current` });
      return;
    }

    // Swap current flag inside a transaction — pointer change only, no new version created
    const rolledBack = await prisma.$transaction(async (tx) => {
      await tx.promptVersion.updateMany({
        where: { promptId: prompt.id, isCurrent: true },
        data: { isCurrent: false },
      });

      const updated = await tx.promptVersion.update({
        where: { id: target.id },
        data: { isCurrent: true },
      });

      await tx.prompt.update({
        where: { id: prompt.id },
        data: { updatedAt: new Date() },
      });

      return updated;
    });

    res.json(rolledBack);
  }
);

export default router;
