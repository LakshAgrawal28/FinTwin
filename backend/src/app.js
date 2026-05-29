import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { errorHandler } from './middleware/errorHandler.js';

import profileRouter from './routes/profile.js';
import simulateRouter from './routes/simulate.js';
import portfolioRouter from './routes/portfolio.js';
import rebalanceRouter from './routes/rebalance.js';
import projectRouter from './routes/project.js';
import insightRouter from './routes/insight.js';
import scenarioParseRouter from './routes/scenarioParse.js';
import healthScoreRouter from './routes/healthScore.js';
import goalsRouter from './routes/goals.js';
import taxOptimizeRouter from './routes/taxOptimize.js';
import reportRouter from './routes/report.js';
import quotesRouter from './routes/quotes.js';
const app = express();

const configuredOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isConfigured = configuredOrigins.includes(origin);
    const isVercelPreview = origin.endsWith('.vercel.app');
    if (isConfigured || isVercelPreview) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/profile', profileRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/rebalance', rebalanceRouter);
app.use('/api/project', projectRouter);
app.use('/api/insight', insightRouter);
app.use('/api/scenario-parse', scenarioParseRouter);
app.use('/api/health-score', healthScoreRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/tax-optimize', taxOptimizeRouter);
app.use('/api/report', reportRouter);
app.use('/api/quotes', quotesRouter);
app.use(errorHandler);

export default app;

