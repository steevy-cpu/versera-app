import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

/**
 * Factory middleware. Deducts `cost` credits from req.user atomically.
 *
 * The Prisma updateMany with `credits: { gte: cost }` in the where clause
 * prevents race conditions — if two requests arrive simultaneously and only
 * one credit remains, only one updateMany will match (count === 1) and the
 * other will get a 402.
 *
 * Usage: router.get("/path", requireApiKey, deductCredits(1), handler)
 */
export function deductCredits(cost: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user!;

    // Fast pre-check to give a clean 402 before hitting the DB for common case
    if (user.credits < cost) {
      res.status(402).json({ error: "Insufficient credits" });
      return;
    }

    // Atomic deduction — the where clause guards against the race condition
    // where credits drop between the pre-check above and this update
    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        credits: { gte: cost },
      },
      data: {
        credits: { decrement: cost },
      },
    });

    if (result.count === 0) {
      // Race condition: another request depleted credits first
      res.status(402).json({ error: "Insufficient credits" });
      return;
    }

    // Keep req.user in sync so downstream handlers see the updated balance
    req.user = { ...user, credits: user.credits - cost };

    next();
  };
}
