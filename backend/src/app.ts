import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import listingsRoutes from './routes/listings';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/listings', listingsRoutes);

app.get('/', (req, res) => res.send({status: 'ok'}));

export default app;
