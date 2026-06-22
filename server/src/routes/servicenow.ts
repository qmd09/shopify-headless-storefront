import { Router, Request, Response } from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
} from '../services/ticketStore';
import { TicketStatus } from '../types/ticket';

const router = Router();

const VALID_STATUSES: TicketStatus[] = [
  'open',
  'confirmed',
  'in-progress',
  'quality-check',
  'completed',
];

// POST /api/servicenow/tickets — create ticket (from webhook handler or booking flow)
router.post('/tickets', (req: Request, res: Response) => {
  const {
    orderId,
    orderNumber,
    customerEmail,
    customerName,
    summary,
    vehicleDetails,
    serviceType,
    location,
    appointmentDate,
    appointmentTime,
  } = req.body;

  if (!orderId) {
    res.status(400).json({ error: 'orderId is required' });
    return;
  }

  const ticket = createTicket({
    orderId: String(orderId),
    orderNumber: String(orderNumber || orderId),
    customerEmail: customerEmail || 'demo@example.com',
    customerName: customerName || 'Demo User',
    summary: summary || `Support ticket for order ${orderNumber || orderId}`,
    vehicleDetails,
    serviceType,
    location,
    appointmentDate,
    appointmentTime,
  });

  res.status(201).json(ticket);
});

// GET /api/servicenow/tickets — return all tickets
router.get('/tickets', (_req: Request, res: Response) => {
  res.json(getAllTickets());
});

// GET /api/servicenow/tickets/:id — return single ticket by ID or orderId
router.get('/tickets/:id', (req: Request, res: Response) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
});

// PATCH /api/servicenow/tickets/:id — advance status (cycles through lifecycle if no body)
router.patch('/tickets/:id', (req: Request, res: Response) => {
  const { status } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
    return;
  }

  const ticket = updateTicketStatus(req.params.id, status as TicketStatus | undefined);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
});

export default router;
