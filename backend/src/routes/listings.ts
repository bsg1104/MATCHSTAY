import {Router} from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (req, res) =>{
  const {city, minPrice, maxPrice, from, to} = req.query as any;
  const where:any = {};
  if(city) where.city = {equals: city};
  if(minPrice || maxPrice){
    where.price = {};
    if(minPrice) where.price.gte = Number(minPrice);
    if(maxPrice) where.price.lte = Number(maxPrice);
  }
  if(from || to){
    where.availableFrom = {lte: new Date(to || '2100-01-01')};
    where.availableTo = {gte: new Date(from || '1900-01-01')};
  }
  const listings = await prisma.listing.findMany({where});
  res.json(listings);
});

export default router;
