import { Request, Response, NextFunction } from "express";
import { requireAuth } from "./requireAuth";
import { requireApiKey } from "./requireApiKey";

export async function requireAuthOrApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const hasApiKey = !!req.header("x-api-key");
  const hasBearer = !!req.header("authorization");

  if (hasApiKey) {
    return requireApiKey(req, res, next);
  }

  if (hasBearer) {
    return requireAuth(req, res, next);
  }

  res.status(401).json({
    error:
      "Authentication required. Provide either x-api-key header or Authorization: Bearer <token>",
  });
}
