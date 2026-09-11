import mongoose from 'mongoose';

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
export const TICKET_PRIORITIES = ['low', 'normal', 'medium', 'high', 'urgent'];

const SupportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: TICKET_STATUSES, default: 'open' },
  priority: { type: String, enum: TICKET_PRIORITIES, default: 'normal' },
  staffResponse: { type: String, maxlength: 5000 }
}, { timestamps: true });

SupportTicketSchema.index({ user: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });

export const SupportTicketModel =
  mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
export default SupportTicketModel;
