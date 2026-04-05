import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawKey = req.headers["x-api-key"];

  if (!rawKey || typeof rawKey !== "string") {
    res.status(401).json({ error: "Missing x-api-key header" });
    return;
  }

  const keyHash = sha256(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revokedAt !== null) {
    res.status(401).json({ error: "Invalid or revoked API key" });
    return;
  }

  // Update lastUsedAt without blocking the request
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {
      // Non-fatal — log in production but don't fail the request
    });

  req.user = apiKey.user;
  next();
}
