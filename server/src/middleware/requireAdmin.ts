import { Request, Response, NextFunction } from 'express'

export const requireAdmin = (
  req: Request, res: Response, next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  if (!req.user.isAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}
