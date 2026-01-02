import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request{
  userId?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({error:'missing auth'});
  const token = header.replace('Bearer ', '');
  try{
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.userId;
    next();
  }catch(e){
    return res.status(401).json({error:'invalid token'});
  }
}
