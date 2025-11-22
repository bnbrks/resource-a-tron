import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }

    const decoded = jwt.verify(token, secret) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}


