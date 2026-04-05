import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/requireAuth";
import { stripe } from "../lib/stripe";
import prisma from "../lib/prisma";

const router = Router();

// ─── Plans catalogue ─────────────────────────────────────────────────────────

const PLANS = [
  { name: "Starter", key: "starter", price: 9,   credits: 10_000,  description: "~10K API resolves",  featured: false },
  { name: "Growth",  key: "growth",  price: 49,  credits: 100_000, description: "~100K API resolves", featured: true  },
  { name: "Scale",   key: "scale",   price: 199, credits: 500_000, description: "~500K API resolves", featured: false },
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
  const user = req.user!;
  const { plan } = req.body ?? {};

  const validKeys = PLANS.map((p) => p.key);
  if (!plan || !validKeys.includes(plan as PlanKey)) {
    res.status(400).json({ error: `plan must be one of: ${validKeys.join(", ")}` });
    return;
  }

  const selected = PLANS.find((p) => p.key === plan)!;

  // Map plan key → Stripe price ID from environment
  const priceIdMap: Record<PlanKey, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth:  process.env.STRIPE_PRICE_GROWTH,
    scale:   process.env.STRIPE_PRICE_SCALE,
  };

  const priceId = priceIdMap[plan as PlanKey];
  if (!priceId) {
    res.status(500).json({ error: `Stripe price ID for plan "${plan}" is not configured` });
    return;
  }

  // Use first value if FRONTEND_URL is comma-separated
  const appUrl =
    (process.env.FRONTEND_URL ?? "").split(",")[0].trim() ||
    "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true&plan=${plan}`,
    cancel_url:  `${appUrl}/billing?cancelled=true`,
    customer_email: user.email,
    metadata: {
      userId:  user.id,
      plan:    plan,
      credits: String(selected.credits),
    },
  });

  if (!session.url) {
    res.status(500).json({ error: "Stripe did not return a checkout URL" });
    return;
  }

  res.json({ checkoutUrl: session.url });
});

// ─── Stripe webhook ──────────────────────────────────────────────────────────
//
// This route is NOT registered on the router below.
// It is exported as a named function and mounted directly in index.ts with
// express.raw() BEFORE express.json(), so Stripe signature verification
// receives the unmodified raw body buffer.
//
// index.ts wires it as:
//   app.post("/v1/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook)

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  // Verify signature — return 400 only here (before the 200 ACK)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    res.status(400).json({ error: "Invalid Stripe signature" });
    return;
  }

  // ACK to Stripe immediately — never return non-200 after this point
  res.status(200).json({ received: true });

  // Process the event after responding so Stripe never times out waiting
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, plan, credits: creditsStr } = session.metadata ?? {};

  if (!userId || !creditsStr) {
    console.error("Stripe webhook: missing metadata on session", session.id, session.metadata);
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error("Stripe webhook: invalid credits value:", creditsStr);
    return;
  }

  const amountCents = session.amount_total ?? 0;
  const planLabel = plan
    ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Pack purchase`
    : "Credit purchase";

  try {
    // Atomically increment both credits and totalCredits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits:      { increment: credits },
        totalCredits: { increment: credits },
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        description: planLabel,
        credits,
        amountCents,
        stripeId: session.id,
      },
    });

    console.log(`Stripe webhook: +${credits} credits → user ${userId} (${session.id})`);
  } catch (err) {
    // Log but do not throw — Stripe already received 200 and must not retry
    console.error("Stripe webhook: error processing checkout.session.completed:", err);
  }
}

export default router;
