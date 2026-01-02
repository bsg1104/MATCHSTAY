import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// GET /profiles/me
router.get('/me', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

// POST /profiles (create or update)
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = req.body;
  // basic validation omitted for brevity
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    const updated = await prisma.profile.update({ where: { userId }, data });
    return res.json(updated);
  } else {
    const created = await prisma.profile.create({ data: { ...data, userId } });
    return res.status(201).json(created);
  }
});

export default router;
