import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import listingRoutes from './routes/listings';
import matchesRoutes from './routes/matches';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// public
app.use('/auth', authRoutes);

// protected
app.use('/profiles', authMiddleware, profileRoutes);
app.use('/listings', authMiddleware, listingRoutes);
app.use('/matches', authMiddleware, matchesRoutes);

// health
app.get('/health', (_req, res) => res.json({ ok: true }));

// basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
