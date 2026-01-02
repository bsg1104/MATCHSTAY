import {Request, Response} from 'express';
import prisma from '../prismaClient';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function signup(req: Request, res: Response){
  const {email, password, name} = req.body;
  if(!email || !password) return res.status(400).json({error:'email and password required'});
  const existing = await prisma.user.findUnique({where:{email}});
  if(existing) return res.status(409).json({error:'email exists'});
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({data:{email, password:hash, name}});
  const token = jwt.sign({userId: user.id}, JWT_SECRET);
  res.json({token});
}

export async function login(req: Request, res: Response){
  const {email, password} = req.body;
  if(!email || !password) return res.status(400).json({error:'email and password required'});
  const user = await prisma.user.findUnique({where:{email}});
  if(!user) return res.status(401).json({error:'invalid credentials'});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({error:'invalid credentials'});
  const token = jwt.sign({userId: user.id}, JWT_SECRET);
  res.json({token});
}
