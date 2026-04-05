import { Router, Request, Response } from "express";
import { TestimonialStatus } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import prisma from "../lib/prisma";

const router = Router();

// ─── POST /v1/testimonials (public) ──────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, role, content, rating } = req.body ?? {};

  if (!name || !role || !content || rating === undefined) {
    res.status(400).json({ error: "name, role, content, and rating are required" });
    return;
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be an integer between 1 and 5" });
    return;
  }
  if (typeof content !== "string" || content.length > 500) {
    res.status(400).json({ error: "content must be 500 characters or fewer" });
    return;
  }

  const testimonial = await prisma.testimonial.create({
    data: { name, role, content, rating },
  });

  res.status(201).json(testimonial);
});

// ─── GET /v1/testimonials (public) ───────────────────────────────────────────

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const testimonials = await prisma.testimonial.findMany({
    where: { status: TestimonialStatus.APPROVED },
    orderBy: { createdAt: "desc" },
  });

  res.json(testimonials);
});

// ─── GET /v1/admin/testimonials (admin) ──────────────────────────────────────

router.get("/admin", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(testimonials);
});

// ─── PUT /v1/admin/testimonials/:id/approve (admin) ──────────────────────────

router.put("/admin/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { status: TestimonialStatus.APPROVED },
  });

  res.json(testimonial);
});

// ─── PUT /v1/admin/testimonials/:id/reject (admin) ───────────────────────────

router.put("/admin/:id/reject", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { status: TestimonialStatus.REJECTED },
  });

  res.json(testimonial);
});

// ─── DELETE /v1/admin/testimonials/:id (admin) ───────────────────────────────

router.delete("/admin/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await prisma.testimonial.delete({ where: { id } });

  res.status(204).send();
});

export default router;
