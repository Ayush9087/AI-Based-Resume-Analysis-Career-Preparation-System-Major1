import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import resumeAnalysisRoutes from './routes/resumeAnalysisRoutes.js';
import skillGapRoutes from './routes/skillGapRoutes.js';
import careerRecommendationRoutes from './routes/careerRecommendationRoutes.js';
import interviewPreparationRoutes from './routes/interviewPreparationRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();
const configuredClientOrigins = env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean);

function isAllowedClientOrigin(origin) {
  if (configuredClientOrigins.includes(origin)) return true;
  return env.NODE_ENV !== 'production'
    && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedClientOrigin(origin)) return callback(null, true);
      const error = new Error('Request origin is not allowed.');
      error.statusCode = 403;
      error.expose = true;
      return callback(error);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '64kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '10kb', parameterLimit: 20 }));

app.get('/', (req, res) => {
  res.json({
    app: 'AI Resume Analysis API',
    status: 'running',
  });
});

app.use('/api', healthRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/resume', resumeAnalysisRoutes);
app.use('/api/skill-gap', skillGapRoutes);
app.use('/api/career-recommendations', careerRecommendationRoutes);
app.use('/api/interview-prep', interviewPreparationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/account', accountRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested endpoint was not found.',
  });
});

app.use(errorHandler);

export default app;
