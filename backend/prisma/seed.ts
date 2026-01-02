import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(){
  await prisma.connectionRequest.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // helper data
  const firstNames = ['Alex','Jamie','Taylor','Jordan','Casey','Morgan','Riley','Cameron','Avery','Dakota','Parker','Rowan'];
  const lastNames = ['Chen','Patel','Garcia','Kim','Nguyen','Brown','Smith','Johnson','Lee','Martinez','Davis','Lopez'];
  const schools = ['State University','Tech Institute','City College','Polytechnic University','Liberal Arts College'];
  const companies = ['Innova Labs','BrightWorks','CloudWave','GreenByte','Apex Solutions','BlueLine Corp','NimbleSoft','Orbit Systems'];
  const cities = ['San Francisco','New York','Seattle','Austin','Boston','Chicago','Los Angeles'];

  const rand = (min:number, max:number) => Math.floor(Math.random()*(max-min+1))+min;
  const randChoice = <T,>(arr:T[]) => arr[Math.floor(Math.random()*arr.length)];
  const randomDateBetween = (start:Date, end:Date) => {
    const s = start.getTime(), e = end.getTime();
    return new Date(rand(s, e));
  };

  const users = [];
  // create 24 users with varied names
  for(let i=1;i<=24;i++){
    const first = randChoice(firstNames);
    const last = randChoice(lastNames);
    const name = `${first} ${last}`;
    const email = `intern${i}@example.com`;
    const password = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({data:{email, password, name}});
    users.push(user);
  }

  // create profiles (one per user) with realistic varied dates/budgets/preferences
  for(let i=0;i<users.length;i++){
    const user = users[i];
    const internshipStart = randomDateBetween(new Date('2026-05-01'), new Date('2026-07-01'));
    const internshipEnd = new Date(internshipStart);
    internshipEnd.setDate(internshipEnd.getDate() + (56 + rand(0,28))); // 8-12 weeks
    const minBudget = 600 + rand(0,6)*100; // 600..1200
    const maxBudget = minBudget + (200 + rand(0,4)*150); // +200..800
    await prisma.profile.create({data:{
      userId: user.id,
      school: randChoice(schools),
      internshipCompany: randChoice(companies),
      internshipCity: randChoice(cities),
      internshipStart,
      internshipEnd,
      budgetMin: minBudget,
      budgetMax: maxBudget,
      cleanliness: rand(1,5),
      sleepSchedule: (Math.random()<0.5)?'early':'late',
      pets: Math.random()<0.3,
      quietLevel: rand(1,5)
    }});
  }

  // create 15 listings with varied prices, dates, and owners
  for(let i=1;i<=15;i++){
    const city = randChoice(cities);
    const availableFrom = randomDateBetween(new Date('2026-04-20'), new Date('2026-06-15'));
    const availableTo = new Date(availableFrom);
    availableTo.setMonth(availableTo.getMonth() + (3 + rand(0,2))); // 3-5 months availability
    const price = 700 + rand(0,8)*100; // 700..1500
    await prisma.listing.create({data:{
      title: `Intern-ready apartment ${i}`,
      description: `Clean, furnished room near transit in ${city}. ${randChoice(['Close to coffee shops.','Quiet building.','Flexible lease for summer interns.'])}`,
      city,
      price,
      availableFrom,
      availableTo,
      roomType: (i%2? 'private':'shared'),
      maxRoommates: (i%3)+1,
      ownerId: users[(i*2) % users.length].id
    }});
  }

  // create some connection requests between users with varied statuses
  const statuses = ['PENDING','ACCEPTED','DECLINED'];
  for(let i=0;i<20;i++){
    const from = users[rand(0, users.length-1)];
    let to = users[rand(0, users.length-1)];
    if(from.id === to.id){
      to = users[(users.indexOf(from)+1) % users.length];
    }
    await prisma.connectionRequest.create({data:{
      fromUserId: from.id,
      toUserId: to.id,
      status: randChoice(statuses)
    }});
  }

  console.log('Seed complete: 24 users, 24 profiles, 15 listings, connection requests added');
}

main().catch(e=>{
  console.error(e);
  process.exit(1);
}).finally(()=>prisma.$disconnect());
