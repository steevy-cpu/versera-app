import { Router, Request, Response } from "express";
import { PromptStatus } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { safeUser } from "../lib/safeUser";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth);

// ─── GET /v1/me ──────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  // Re-fetch to get the freshest credit balance
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(safeUser(fresh));
});

// ─── GET /v1/me/stats ─────────────────────────────────────────────────────────

router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalPrompts, apiCallsToday, activeVersions] = await Promise.all([
    // All non-deleted prompts for this user
    prisma.prompt.count({
      where: { userId: user.id, status: { not: PromptStatus.DELETED } },
    }),

    // Resolve transactions logged today
    prisma.transaction.count({
      where: {
        userId: user.id,
        description: { startsWith: "resolve:" },
        createdAt: { gte: todayStart },
      },
    }),

    // Versions currently marked as active across all user prompts
    prisma.promptVersion.count({
      where: {
        isCurrent: true,
        prompt: { userId: user.id },
      },
    }),
  ]);

  res.json({
    totalPrompts,
    apiCallsToday,
    creditsRemaining: user.credits,
    activeVersions,
  });
});

// ─── GET /v1/me/usage ────────────────────────────────────────────────────────

router.get("/usage", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const resolveCalls = await prisma.transaction.count({
    where: {
      userId: user.id,
      description: { startsWith: "resolve:" },
      createdAt: { gte: monthStart },
    },
  });

  res.json({
    resolveCalls,
    abAssignments: 0,  // MVP placeholder
    logsSubmitted: 0,  // MVP placeholder
  });
});

export default router;
