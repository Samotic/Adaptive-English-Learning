/**
 * Data retention (FR19): periodically removes training data and audit logs older than the
 * configured retention windows (TRAINING_DATA_RETENTION_DAYS, AUDIT_LOG_RETENTION_DAYS).
 */
import { config } from '../config.js';
import { clearOldTrainingData } from '../services/dataCollectionService.js';
import { cleanupOldLogs } from '../services/auditService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runRetention() {
  const training = await clearOldTrainingData(config.retention.trainingDataDays);
  const auditLogs = await cleanupOldLogs(config.retention.auditLogDays);
  return { trainingData: training.deletedCount, auditLogs };
}

export function startRetentionJobs() {
  const run = async () => {
    try {
      const removed = await runRetention();
      if (removed.trainingData || removed.auditLogs) {
        console.log(`[Retention] Removed ${removed.trainingData} training records and ${removed.auditLogs} audit logs`);
      }
    } catch (err) {
      console.error('[Retention] Job failed:', err.message);
    }
  };

  const firstRun = setTimeout(run, 60 * 1000);
  const daily = setInterval(run, DAY_MS);
  firstRun.unref();
  daily.unref();
  return () => {
    clearTimeout(firstRun);
    clearInterval(daily);
  };
}
