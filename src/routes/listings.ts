import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// POST /listings
router.post('/', async (req: AuthRequest, res) => {
  const ownerId = req.userId!;
  const data = req.body;
  const created = await prisma.listing.create({ data: { ...data, ownerId } });
  res.status(201).json(created);
});

// GET /listings/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// PUT /listings/:id
router.put('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const ownerId = req.userId!;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== ownerId) return res.status(403).json({ error: 'Not allowed' });
  const updated = await prisma.listing.update({ where: { id }, data: req.body });
  res.json(updated);
});

// DELETE /listings/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const ownerId = req.userId!;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== ownerId) return res.status(403).json({ error: 'Not allowed' });
  await prisma.listing.delete({ where: { id } });
  res.status(204).send();
});

// GET /listings?city=&minPrice=&maxPrice=&start=&end=
router.get('/', async (req, res) => {
  const { city, minPrice, maxPrice, start, end } = req.query;
  const where: any = {};
  if (city) where.city = String(city);
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (start || end) {
    where.AND = [];
    if (start) where.AND.push({ availableStart: { lte: new Date(String(start)) } });
    if (end) where.AND.push({ availableEnd: { gte: new Date(String(end)) } });
  }
  const listings = await prisma.listing.findMany({ where, orderBy: { price: 'asc' } });
  res.json(listings);
});

export default router;
