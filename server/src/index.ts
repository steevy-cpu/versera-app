import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import promptRoutes from "./routes/prompts";
import versionRoutes from "./routes/versions";
import resolveRoutes from "./routes/resolve";
import apiKeyRoutes from "./routes/apiKeys";
import billingRoutes, { stripeWebhook } from "./routes/billing";
import adminRoutes from "./routes/admin";
import testimonialRoutes from "./routes/testimonials";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Global middleware ────────────────────────────────────────────────────────

// FRONTEND_URL may be a comma-separated list to allow multiple origins
// e.g. FRONTEND_URL=https://foo.lovable.app,https://bar.lovable.app
const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Stripe webhook needs the raw body — mount it explicitly before express.json()
// so its express.raw() middleware takes effect only on that path.
app.post(
  "/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/auth", authRoutes);
app.use("/v1/me", userRoutes);
app.use("/v1/prompts", versionRoutes); // /:slug/versions — must come before /:slug catch-all
app.use("/v1/prompts", promptRoutes);
app.use("/v1/resolve", resolveRoutes);
app.use("/v1/api-keys", apiKeyRoutes);
app.use("/v1/billing", billingRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/v1/testimonials", testimonialRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Versera API running on http://localhost:${PORT}`);
});

export default app;
