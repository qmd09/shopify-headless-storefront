import { randomUUID } from 'crypto';
import { CreateTicketInput, Ticket, TicketStatus } from '../types/ticket';

const tickets: Ticket[] = [];

const STATUS_CYCLE: Record<TicketStatus, TicketStatus> = {
  open: 'confirmed',
  confirmed: 'in-progress',
  'in-progress': 'quality-check',
  'quality-check': 'completed',
  completed: 'open',
};

export const createTicket = (input: CreateTicketInput): Ticket => {
  const ticket: Ticket = {
    id: `INC${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    summary: input.summary,
    status: 'open',
    createdAt: new Date().toISOString(),
    ...(input.vehicleDetails && { vehicleDetails: input.vehicleDetails }),
    ...(input.serviceType && { serviceType: input.serviceType }),
    ...(input.location && { location: input.location }),
    ...(input.appointmentDate && { appointmentDate: input.appointmentDate }),
    ...(input.appointmentTime && { appointmentTime: input.appointmentTime }),
  };
  tickets.push(ticket);
  return ticket;
};

export const getAllTickets = (): Ticket[] => [...tickets].reverse();

// Supports lookup by ticket ID or by orderId (for booking confirmation polling)
export const getTicketById = (idOrOrderId: string): Ticket | undefined =>
  tickets.find((t) => t.id === idOrOrderId || t.orderId === idOrOrderId);

export const updateTicketStatus = (id: string, status?: TicketStatus): Ticket | null => {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = status ?? STATUS_CYCLE[ticket.status];
  return ticket;
};
