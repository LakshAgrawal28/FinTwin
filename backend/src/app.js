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
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if it's a deployed preview/production URL or local
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('vercel.app');
    const isRender = origin.includes('onrender.com');
    const isConfigured = configuredOrigins.some(o => origin.startsWith(o));
    
    if (isLocal || isVercel || isRender || isConfigured) {
      return callback(null, true);
    }
    
    // In production, we might want to log rejected origins for debugging
    console.warn(`CORS rejected origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health Check Route for Deployment Verification
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'FinTwin Institutional API',
    timestamp: new Date().toISOString()
  });
});

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

