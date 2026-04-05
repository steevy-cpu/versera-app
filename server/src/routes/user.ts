import { Router, Request, Response } from "express";
import { PromptStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { requireAuth } from "../middleware/requireAuth";
import { safeUser } from "../lib/safeUser";
import prisma from "../lib/prisma";
import { sendAccountDeletionEmail } from "../lib/email";

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

// ─── PUT /v1/me/password ─────────────────────────────────────────────────────

router.put("/password", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "newPassword must be at least 8 characters" });
    return;
  }

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, fresh.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  });

  res.json({ message: "Password updated" });
});

// ─── DELETE /v1/me ───────────────────────────────────────────────────────────

router.delete("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { confirmation } = req.body ?? {};

  if (confirmation !== "DELETE") {
    res.status(400).json({ error: 'confirmation must be the string "DELETE"' });
    return;
  }

  // Send email before deletion while we still have the address
  await sendAccountDeletionEmail(user.email, user.name);

  // Delete all user data in dependency order
  const userPrompts = await prisma.prompt.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const promptIds = userPrompts.map((p) => p.id);

  await prisma.$transaction([
    prisma.promptVersion.deleteMany({ where: { promptId: { in: promptIds } } }),
    prisma.prompt.deleteMany({ where: { userId: user.id } }),
    prisma.apiKey.deleteMany({ where: { userId: user.id } }),
    prisma.transaction.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  res.status(204).send();
});

export default router;
