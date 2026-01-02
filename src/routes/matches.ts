import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// POST /matches/for-me
// returns ranked list of other users with compatibility score 0-100
router.post('/for-me', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const me = await prisma.profile.findUnique({ where: { userId } });
  if (!me) return res.status(404).json({ error: 'Your profile is required' });

  const others = await prisma.profile.findMany({ where: { userId: { not: userId } } });

  function dateOverlapFraction(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    const start = aStart > bStart ? aStart : bStart;
    const end = aEnd < bEnd ? aEnd : bEnd;
    if (end <= start) return 0;
    const overlap = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const myDuration = (aEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(1, overlap / Math.max(1, myDuration));
  }

  function budgetScore(aMin: number, aMax: number, bMin: number, bMax: number) {
    const overlapMin = Math.max(aMin, bMin);
    const overlapMax = Math.min(aMax, bMax);
    if (overlapMax < overlapMin) {
      // distance from ranges normalized
      const dist = Math.max(bMin - aMax, aMin - bMax);
      return Math.max(0, 1 - dist / Math.max(500, Math.abs(aMax - aMin) + Math.abs(bMax - bMin)));
    }
    const overlap = overlapMax - overlapMin;
    const union = Math.max(aMax, bMax) - Math.min(aMin, bMin);
    return Math.min(1, overlap / Math.max(1, union));
  }

  function lifestyleScore(a: any, b: any) {
    // cleanliness and quietLevel 1-5 -> small differences penalized
    const cleanDiff = Math.abs(a.cleanliness - b.cleanliness) / 4; // 0..1
    const quietDiff = Math.abs(a.quietLevel - b.quietLevel) / 4;
    const sleepMatch = a.sleepSchedule === b.sleepSchedule ? 1 : 0;
    const petsMatch = a.pets === b.pets ? 1 : 0;
    // weighted: cleanliness 35%, quiet 35%, sleep 15%, pets 15%
    const score =
      (1 - cleanDiff) * 0.35 + (1 - quietDiff) * 0.35 + sleepMatch * 0.15 + petsMatch * 0.15;
    return Math.max(0, Math.min(1, score));
  }

  const results = others.map(o => {
    const overlapFrac = dateOverlapFraction(
      new Date(me.internshipStart),
      new Date(me.internshipEnd),
      new Date(o.internshipStart),
      new Date(o.internshipEnd),
    );
    if (overlapFrac <= 0) return { userId: o.userId, score: 0 }; // date overlap required

    const bScore = budgetScore(me.budgetMin, me.budgetMax, o.budgetMin, o.budgetMax);
    const lScore = lifestyleScore(me, o);
    const locationMatch = me.internshipCity === o.internshipCity ? 1 : 0;

    // weights: date 30, budget 25, lifestyle 30, location 15
    const total =
      overlapFrac * 30 + bScore * 25 + lScore * 30 + locationMatch * 15;

    return { userId: o.userId, score: Math.round(total) };
  });

  const ranked = results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  res.json(ranked);
});

export default router;
