import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import monitoringService from '../services/monitoringService.js';

// NFR1-3: performance monitoring, uptime tracking, health checks

/** Public health check (GET /health). Only exposes coarse status. */
export const healthHandler = asyncHandler(async (req, res) => {
  const health = await monitoringService.performHealthCheck({ mongoose });
  res.status(health.status === 'unhealthy' ? 503 : 200).json({
    status: health.status,
    database: health.checks.database?.status,
    uptime: health.checks.uptime?.formatted,
    timestamp: Date.now()
  });
});

// Mounted at /api/monitoring
const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/metrics', (req, res) => {
  res.json(monitoringService.getPerformanceMetrics());
});

router.get('/endpoints', (req, res) => {
  res.json(monitoringService.getEndpointMetrics());
});

router.get('/dashboard', asyncHandler(async (req, res) => {
  await monitoringService.performHealthCheck({ mongoose });
  res.json(monitoringService.getMonitoringData({ mongoose }));
}));

export default router;
