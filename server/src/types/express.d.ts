import { User } from "@prisma/client";

// Extend Express Request so req.user is available after auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiKeyId?: string;
    }
  }
}
