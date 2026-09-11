import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import monitoringService from './services/monitoringService.js';

import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessment.js';
import learningRoutes from './routes/learning.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import supportRoutes from './routes/support.js';
import profileRoutes from './routes/profile.js';
import gdprRoutes from './routes/gdpr.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import gamificationRoutes from './routes/gamification.js';
import assignmentRoutes from './routes/assignments.js';
import monitoringRoutes, { healthHandler } from './routes/monitoring.js';
import trainingDataRoutes from './routes/trainingData.js';
import aiRoutes from './routes/ai.js';
import auditRoutes from './routes/audit.js';
import mlopsRoutes from './routes/mlops.js';
import contentRoutes from './routes/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '..', '..', 'client', 'dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(helmet({
    // When the React build is served from this server it needs Google Sign-In and remote images
    contentSecurityPolicy: config.serveClient
      ? {
        directives: {
          scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client'],
          frameSrc: ["'self'", 'https://accounts.google.com/gsi/'],
          connectSrc: ["'self'", 'https://accounts.google.com/gsi/'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      }
      : undefined,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  }));
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '1mb' }));
  app.use(monitoringService.requestTracker());

  app.get('/health', healthHandler);

  app.use('/api', authRoutes);
  app.use('/api', assessmentRoutes);
  app.use('/api', learningRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', assignmentRoutes);
  app.use('/api', contentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/gdpr', gdprRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/training-data', trainingDataRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/mlops', mlopsRoutes);
  app.use('/api', notFound);

  // Optional single-server deployment: serve the built client (npm run build) with SPA routing
  if (config.serveClient && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
