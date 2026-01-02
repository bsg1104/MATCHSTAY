import prisma from '../prismaClient';

// Deterministic scoring (0-100)
export async function scoreCompatibility(userId: number, candidateId: number){
  const userProfile = await prisma.profile.findUnique({where:{userId}});
  const candProfile = await prisma.profile.findUnique({where:{userId: candidateId}});
  if(!userProfile || !candProfile) return 0;

  // Date overlap required: if internships don't overlap, return 0
  if(!userProfile.internshipStart || !userProfile.internshipEnd || !candProfile.internshipStart || !candProfile.internshipEnd) return 0;
  const latestStart = userProfile.internshipStart > candProfile.internshipStart ? userProfile.internshipStart : candProfile.internshipStart;
  const earliestEnd = userProfile.internshipEnd < candProfile.internshipEnd ? userProfile.internshipEnd : candProfile.internshipEnd;
  if(latestStart > earliestEnd) return 0;

  let score = 0;
  // Date overlap -> base 30
  score += 30;

  // Budget compatibility (20 points)
  if(userProfile.budgetMin && userProfile.budgetMax && candProfile.budgetMin && candProfile.budgetMax){
    const overlapMin = Math.max(userProfile.budgetMin, candProfile.budgetMin);
    const overlapMax = Math.min(userProfile.budgetMax, candProfile.budgetMax);
    const overlap = Math.max(0, overlapMax - overlapMin);
    const userRange = userProfile.budgetMax - userProfile.budgetMin || 1;
    const pct = Math.min(1, overlap / userRange);
    score += Math.round(pct * 20);
  }

  // Lifestyle similarity (30 points)
  let lifestyleScore = 0;
  if(userProfile.cleanliness && candProfile.cleanliness){
    const diff = Math.abs(userProfile.cleanliness - candProfile.cleanliness);
    lifestyleScore += Math.max(0, (1 - diff/4)) * 10; // cleanliness up to 10
  }
  if(userProfile.sleepSchedule && candProfile.sleepSchedule){
    lifestyleScore += (userProfile.sleepSchedule === candProfile.sleepSchedule) ? 10 : 0;
  }
  if(typeof userProfile.pets === 'boolean' && typeof candProfile.pets === 'boolean'){
    lifestyleScore += (userProfile.pets === candProfile.pets) ? 5 : 0;
  }
  if(userProfile.quietLevel && candProfile.quietLevel){
    const diff = Math.abs(userProfile.quietLevel - candProfile.quietLevel);
    lifestyleScore += Math.max(0, (1 - diff/4)) * 5;
  }
  score += Math.round(lifestyleScore);

  // Location match (20 points)
  if(userProfile.internshipCity && candProfile.internshipCity){
    score += (userProfile.internshipCity === candProfile.internshipCity) ? 20 : 0;
  }

  // clamp
  if(score > 100) score = 100;
  if(score < 0) score = 0;
  return Math.round(score);
}

export async function findMatchesForUser(userId: number, limit=20){
  // naive: sample other users with profiles
  const candidates = await prisma.profile.findMany({where:{NOT:{userId}}});
  const scored = [] as any[];
  for(const c of candidates){
    const s = await scoreCompatibility(userId, c.userId);
    if(s>0) scored.push({userId: c.userId, score: s});
  }
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0, limit);
}
