import mongoose from 'mongoose';

/**
 * Audit Log Schema
 * Tracks security-related actions and system events
 */
const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  
  user: {
    type: String,
    required: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  details: {
    type: String
  },
  
  ip_address: {
    type: String
  },
  
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS'
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Index for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLogModel = mongoose.models.AuditLog || 
  mongoose.model('AuditLog', AuditLogSchema);

export default AuditLogModel;
