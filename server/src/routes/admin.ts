import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth, requireAdmin);

// ─── GET /v1/admin/stats ─────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalPrompts,
    totalResolves,
    revenueAggregate,
    newUsersToday,
    newUsersThisWeek,
    activeUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.prompt.count(),
    prisma.transaction.count({
      where: { description: { contains: "resolve" } },
    }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: oneDayAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }).then((rows) => rows.length),
  ]);

  res.json({
    totalUsers,
    totalPrompts,
    totalResolves,
    totalRevenueCents: revenueAggregate._sum.amountCents ?? 0,
    newUsersToday,
    newUsersThisWeek,
    activeUsersThisWeek,
  });
});

// ─── GET /v1/admin/users ─────────────────────────────────────────────────────

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { prompts: true } },
        transactions: {
          select: { amountCents: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.count(),
  ]);

  const shaped = users.map(({ _count, transactions, passwordHash: _ph, ...user }) => {
    const totalSpentCents = transactions.reduce((sum, t) => sum + t.amountCents, 0);
    const lastActiveAt = transactions[0]?.createdAt?.toISOString() ?? null;
    return {
      ...user,
      promptCount: _count.prompts,
      totalSpentCents,
      lastActiveAt,
    };
  });

  res.json({
    users: shaped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// ─── GET /v1/admin/users/:id ─────────────────────────────────────────────────

router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      prompts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          environment: true,
          status: true,
          createdAt: true,
          _count: { select: { versions: true } },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          description: true,
          credits: true,
          amountCents: true,
          createdAt: true,
        },
      },
      apiKeys: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          createdAt: true,
          lastUsedAt: true,
          revokedAt: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _ph, ...safeUser } = user;
  res.json(safeUser);
});

// ─── GET /v1/admin/revenue ───────────────────────────────────────────────────

router.get("/revenue", async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalAggregate, thisMonthAggregate, lastMonthAggregate, allPurchases, recentTransactions] =
    await Promise.all([
      prisma.transaction.aggregate({ _sum: { amountCents: true } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { amountCents: true },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
        _sum: { amountCents: true },
      }),
      prisma.transaction.findMany({
        where: { amountCents: { gt: 0 } },
        select: { description: true, amountCents: true },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const byPlan = {
    starter: { count: 0, revenueCents: 0 },
    growth:  { count: 0, revenueCents: 0 },
    scale:   { count: 0, revenueCents: 0 },
  };

  for (const t of allPurchases) {
    const desc = t.description.toLowerCase();
    if (desc.includes("starter")) {
      byPlan.starter.count++;
      byPlan.starter.revenueCents += t.amountCents;
    } else if (desc.includes("growth")) {
      byPlan.growth.count++;
      byPlan.growth.revenueCents += t.amountCents;
    } else if (desc.includes("scale")) {
      byPlan.scale.count++;
      byPlan.scale.revenueCents += t.amountCents;
    }
  }

  res.json({
    totalRevenueCents: totalAggregate._sum.amountCents ?? 0,
    thisMonthCents:    thisMonthAggregate._sum.amountCents ?? 0,
    lastMonthCents:    lastMonthAggregate._sum.amountCents ?? 0,
    byPlan,
    recentTransactions,
  });
});

export default router;
