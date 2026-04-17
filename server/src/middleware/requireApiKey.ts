import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";

export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    res.status(401).json({ error: "API key required" });
    return;
  }

  if (!apiKey.startsWith("vrs_")) {
    res.status(401).json({ error: "Invalid API key format" });
    return;
  }

  const keyHash = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const record = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!record || !record.user) {
    res.status(401).json({ error: "Invalid or revoked API key" });
    return;
  }

  // Fire-and-forget update of lastUsedAt
  prisma.apiKey
    .update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  // Attach full user object same shape as requireAuth, minus passwordHash
  const { passwordHash, ...safeUser } = record.user;
  req.user = safeUser as any;
  req.apiKeyId = record.id;

  next();
}
