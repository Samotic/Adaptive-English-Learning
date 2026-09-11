/**
 * Audit Service
 * Logs security-related actions and system events
 */

import AuditLogModel from '../models/auditLog.js';

/**
 * Create an audit log entry
 */
export async function logAction(action, user, details, ipAddress, status = 'SUCCESS', userId = null) {
  try {
    await AuditLogModel.create({
      action,
      user,
      userId,
      details,
      ip_address: ipAddress,
      status
    });
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
  }
}

/**
 * Get all audit logs (with optional filters)
 */
const escapeRegex = (value) => String(value).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function getAuditLogs(filters = {}) {
  const query = {};

  if (typeof filters.user === 'string' && filters.user) {
    query.user = new RegExp(escapeRegex(filters.user), 'i');
  }

  if (typeof filters.action === 'string' && filters.action) {
    query.action = new RegExp(escapeRegex(filters.action), 'i');
  }

  if (filters.status === 'SUCCESS' || filters.status === 'FAILURE') {
    query.status = filters.status;
  }
  
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }
  
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 1000, 1), 1000);
  return await AuditLogModel.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get audit logs for specific user
 */
export async function getUserAuditLogs(userId, limit = 100) {
  return await AuditLogModel.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
}

/**
 * Delete old audit logs (cleanup)
 */
export async function cleanupOldLogs(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await AuditLogModel.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
}
