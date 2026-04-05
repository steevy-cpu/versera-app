import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import promptRoutes from "./routes/prompts";
import versionRoutes from "./routes/versions";
import resolveRoutes from "./routes/resolve";
import apiKeyRoutes from "./routes/apiKeys";
import billingRoutes from "./routes/billing";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));

// Stripe webhook needs the raw body — mount it explicitly before express.json()
// so its express.raw() middleware takes effect only on that path.
app.post(
  "/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  (_req, res) => {
    // Handled inside billingRoutes — this entry point just ensures correct body parsing
    res.status(200).json({ received: true });
  }
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
