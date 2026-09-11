import crypto from 'crypto';
import express from 'express';
import SupportTicketModel, { TICKET_PRIORITIES, TICKET_STATUSES } from '../models/supportTicket.js';
import { requireAuth, requireStaff, isStaff } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import * as notificationService from '../services/notificationService.js';

// Mounted at /api/support (FR21: support contact form)
const router = express.Router();
router.use(requireAuth);

const toTicketDTO = (t) => ({
  id: t.ticketNumber,
  subject: t.subject,
  message: t.message,
  status: t.status,
  priority: t.priority,
  staffResponse: t.staffResponse,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  ...(t.user?.username && { user: { username: t.user.username } })
});

router.post('/tickets', asyncHandler(async (req, res) => {
  const { subject, message, priority } = req.body || {};
  if (typeof subject !== 'string' || !subject.trim() || typeof message !== 'string' || !message.trim()) {
    throw new HttpError(400, 'Subject and message are required');
  }

  const ticket = await SupportTicketModel.create({
    ticketNumber: `TICK-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    user: req.user._id,
    subject,
    message,
    priority: TICKET_PRIORITIES.includes(priority) ? priority : 'normal'
  });

  await notificationService.sendSupportConfirmation(req.user._id, ticket.ticketNumber);

  res.status(201).json({
    success: true,
    ticket: toTicketDTO(ticket),
    message: 'Your support request has been received. We will get back to you shortly.'
  });
}));

router.get('/tickets', asyncHandler(async (req, res) => {
  const tickets = await SupportTicketModel.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ tickets: tickets.map(toTicketDTO) });
}));

router.get('/tickets/all', requireStaff, asyncHandler(async (req, res) => {
  const query = TICKET_STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  const tickets = await SupportTicketModel.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'username')
    .lean();
  res.json({ tickets: tickets.map(toTicketDTO) });
}));

// Owners may resolve/close their own tickets; staff may change status and respond
router.patch('/tickets/:ticketId', asyncHandler(async (req, res) => {
  const ticket = await SupportTicketModel.findOne({ ticketNumber: String(req.params.ticketId) });
  if (!ticket) throw new HttpError(404, 'Ticket not found');

  const owner = ticket.user.toString() === req.userId;
  const staff = isStaff(req.user);
  if (!owner && !staff) throw new HttpError(403, 'You cannot modify this ticket');

  const { status, staffResponse } = req.body || {};
  if (status !== undefined) {
    if (!TICKET_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
    if (!staff && !['resolved', 'closed'].includes(status)) {
      throw new HttpError(403, 'You can only resolve or close your own tickets');
    }
    ticket.status = status;
  }
  if (staffResponse !== undefined) {
    if (!staff) throw new HttpError(403, 'Only staff can respond to tickets');
    ticket.staffResponse = String(staffResponse).slice(0, 5000);
  }
  await ticket.save();

  if (staff && !owner) {
    await notificationService.sendNotification(
      ticket.user,
      'system',
      `Support ticket #${ticket.ticketNumber} updated`,
      ticket.staffResponse || `Status changed to ${ticket.status}`
    );
  }

  res.json({ success: true, ticket: toTicketDTO(ticket) });
}));

export default router;
