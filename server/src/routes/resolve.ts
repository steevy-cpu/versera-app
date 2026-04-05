import { Router, Request, Response } from "express";
import { requireApiKey } from "../middleware/requireApiKey";
import { deductCredits } from "../middleware/deductCredits";
import prisma from "../lib/prisma";

const router = Router();

// ─── GET /v1/resolve/:promptSlug ─────────────────────────────────────────────
//
// The core developer-facing endpoint. Called from user apps to fetch the
// current rendered prompt template for a given slug.
//
// Auth:    x-api-key header (API key belonging to the prompt owner)
// Credits: 1 credit deducted per successful call
//
// Query params map to template variables:
//   GET /v1/resolve/summarize-doc?tone=professional&max_words=200
//   → replaces {{tone}} and {{max_words}} in the template
//   → any unreferenced {{variable}} is left as-is in the output

router.get(
  "/:promptSlug",
  requireApiKey,
  deductCredits(1),
  async (req: Request, res: Response): Promise<void> => {
    const { promptSlug } = req.params;
    const user = req.user!;

    const prompt = await prisma.prompt.findUnique({
      where: {
        userId_slug: { userId: user.id, slug: promptSlug },
      },
      include: {
        versions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!prompt) {
      res.status(404).json({ error: `Prompt "${promptSlug}" not found` });
      return;
    }

    const currentVersion = prompt.versions[0];
    if (!currentVersion) {
      res.status(404).json({
        error: `Prompt "${promptSlug}" has no published version`,
      });
      return;
    }

    // Extract all {{variable}} names from the raw template
    const variableMatches = currentVersion.template.match(/{{(\w+)}}/g) ?? [];
    const variables = [
      ...new Set(variableMatches.map((m) => m.replace(/{{|}}/g, ""))),
    ];

    // Inject query params into template; leave unreferenced vars unreplaced
    const rendered = currentVersion.template.replace(
      /{{(\w+)}}/g,
      (_match, key) => {
        const value = req.query[key];
        return typeof value === "string" ? value : `{{${key}}}`;
      }
    );

    const responsePayload = {
      versionId: currentVersion.id,
      template: rendered,
      variables,
      promptSlug: prompt.slug,
      environment: prompt.environment,
      resolvedAt: new Date().toISOString(),
    };

    // Log the resolve for stats/usage counters — fire-and-forget, non-blocking
    prisma.transaction
      .create({
        data: {
          userId: user.id,
          description: `resolve:${prompt.slug}`,
          credits: -1,
          amountCents: 0,
        },
      })
      .catch(() => {
        // Non-fatal — don't fail the resolve if logging fails
      });

    res.json(responsePayload);
  }
);

export default router;
