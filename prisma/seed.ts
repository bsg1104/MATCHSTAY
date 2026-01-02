import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const cities = [
  { city: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { city: 'New York', lat: 40.7128, lng: -74.0060 },
  { city: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { city: 'Austin', lat: 30.2672, lng: -97.7431 },
  { city: 'Boston', lat: 42.3601, lng: -71.0589 },
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await prisma.connectionRequest.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const users = [];
  for (let i = 0; i < 22; i++) {
    const email = `intern${i + 1}@example.com`;
    const password = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: { email, password },
    });
    const city = cities[i % cities.length];
    const start = new Date(2026, randInt(5, 6), randInt(1, 10)); // June-July 2026
    const end = new Date(start);
    end.setMonth(start.getMonth() + randInt(2, 3));
    const budgetMin = randInt(800, 1500);
    const budgetMax = budgetMin + randInt(200, 800);

    await prisma.profile.create({
      data: {
        userId: user.id,
        name: `Intern ${i + 1}`,
        school: ['MIT', 'Stanford', 'UCB', 'CMU', 'NYU'][i % 5],
        internshipCompany: ['Google', 'Meta', 'Amazon', 'Stripe', 'Salesforce'][i % 5],
        internshipCity: city.city,
        internshipStart: start,
        internshipEnd: end,
        budgetMin,
        budgetMax,
        cleanliness: randInt(1, 5),
        sleepSchedule: Math.random() > 0.5 ? 'early' : 'late',
        pets: Math.random() > 0.7,
        quietLevel: randInt(1, 5),
      },
    });

    users.push(user);
  }

  // Create 12 listings across cities
  for (let i = 0; i < 12; i++) {
    const city = cities[i % cities.length];
    const start = new Date(2026, 5 + randInt(0, 1), randInt(1, 10));
    const end = new Date(start);
    end.setMonth(start.getMonth() + randInt(2, 4));
    await prisma.listing.create({
      data: {
        ownerId: users[i % users.length].id,
        title: `${city.city} ${i % 3 === 0 ? 'Private' : 'Shared'} Room near downtown`,
        description: 'Short-term furnished room, utilities included.',
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        price: randInt(900, 3000),
        availableStart: start,
        availableEnd: end,
        roomType: i % 3 === 0 ? 'private' : 'shared',
        maxRoommates: i % 3 === 0 ? 1 : randInt(1, 3),
      },
    });
  }

  console.log('Seed finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
