import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../lib/prisma";

const router = Router();

// ─── Plans catalogue ─────────────────────────────────────────────────────────

const PLANS = [
  { name: "Starter", key: "starter", price: 9, credits: 10000, description: "~10K API resolves", featured: false },
  { name: "Growth",  key: "growth",  price: 49, credits: 100000, description: "~100K API resolves", featured: true },
  { name: "Scale",   key: "scale",   price: 199, credits: 500000, description: "~500K API resolves", featured: false },
] as const;

type PlanKey = (typeof PLANS)[number]["key"];

// ─── GET /v1/billing/plans — public ──────────────────────────────────────────

router.get("/plans", (_req: Request, res: Response): void => {
  res.json(PLANS);
});

// All routes below require auth
router.use(requireAuth);

// ─── GET /v1/billing/transactions ────────────────────────────────────────────

router.get("/transactions", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json(transactions);
});

// ─── POST /v1/billing/checkout ───────────────────────────────────────────────

router.post("/checkout", async (req: Request, res: Response): Promise<void> => {
  const { plan } = req.body ?? {};

  const validKeys = PLANS.map((p) => p.key);
  if (!plan || !validKeys.includes(plan as PlanKey)) {
    res.status(400).json({ error: `plan must be one of: ${validKeys.join(", ")}` });
    return;
  }

  const selected = PLANS.find((p) => p.key === plan)!;

  // Stripe integration scaffold — replace with real Checkout Session creation:
  //   const session = await stripe.checkout.sessions.create({ ... })
  //   res.json({ checkoutUrl: session.url })
  res.json({
    checkoutUrl: "https://stripe.com/placeholder",
    plan: selected,
    message: "Stripe integration coming soon",
  });
});

// ─── POST /v1/billing/webhook ────────────────────────────────────────────────
//
// IMPORTANT: This route must receive the raw request body (Buffer), not the
// parsed JSON. In index.ts, mount it with express.raw() BEFORE express.json():
//
//   app.post("/v1/billing/webhook", express.raw({ type: "application/json" }), billingRoutes)
//
// Steps when implemented:
//   1. stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
//   2. On checkout.session.completed:
//      - Parse credits from session.metadata
//      - prisma.user.update({ credits: { increment: credits } })
//      - prisma.transaction.create({ description: "Credit purchase", credits, amountCents })

router.post("/webhook", (_req: Request, res: Response): void => {
  // Scaffold only — implement when Stripe keys are available
  res.status(200).json({ received: true });
});

export default router;
