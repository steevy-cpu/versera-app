import { Router, Request, Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateRawKey(): string {
  return "vrs_live_" + crypto.randomBytes(16).toString("hex"); // 41 chars total
}

// "vrs_live_xxxxxxxxxxxxxxxx••••yyyy" — first 16 + mask + last 4
function buildKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 16) + "••••" + rawKey.slice(-4);
}

// Strip keyHash from ApiKey before sending to client
function safeKey(key: {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  userId: string;
  keyHash: string;
}) {
  const { keyHash: _omit, ...rest } = key;
  return rest;
}

// ─── GET /v1/api-keys ────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  res.json(keys.map(safeKey));
});

// ─── POST /v1/api-keys ───────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { name } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const rawKey = generateRawKey();
  const keyHash = sha256(rawKey);
  const keyPrefix = buildKeyPrefix(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: name.trim(),
      keyHash,
      keyPrefix,
    },
  });

  // Return the full raw key ONCE — it is never stored and cannot be retrieved again
  res.status(201).json({
    ...safeKey(apiKey),
    fullKey: rawKey,
  });
});

// ─── DELETE /v1/api-keys/:id ─────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;

  const apiKey = await prisma.apiKey.findUnique({ where: { id } });

  if (!apiKey || apiKey.userId !== user.id || apiKey.revokedAt !== null) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  res.status(204).send();
});

export default router;
