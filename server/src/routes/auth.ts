import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { safeUser } from "../lib/safeUser";
import { sendWelcomeEmail } from "../lib/email";

const router = Router();

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = "30d";
const STARTER_CREDITS = 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── POST /auth/register ─────────────────────────────────────────────────────

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      avatar: name.trim()[0].toUpperCase(),
      credits: STARTER_CREDITS,
      totalCredits: STARTER_CREDITS,
    },
  });

  const token = signToken(user.id);

  sendWelcomeEmail(user.email, user.name)
    .catch(err => console.error('Welcome email failed:', err));

  res.status(201).json({ user: safeUser(user), token });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Use a dummy compare even on miss to avoid timing-based user enumeration
  const passwordHash = user?.passwordHash ?? "$2b$12$invalidhashfortimingprotection";
  const valid = await bcrypt.compare(password, passwordHash);

  if (!user || !valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id);

  res.json({ user: safeUser(user), token });
});

export default router;
