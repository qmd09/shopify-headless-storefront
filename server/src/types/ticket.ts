export type TicketStatus =
  | 'open'
  | 'confirmed'
  | 'in-progress'
  | 'quality-check'
  | 'completed';

export interface VehicleDetails {
  rego: string;
  make: string;
  model: string;
  year: number;
}

export interface Ticket {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: TicketStatus;
  createdAt: string;
  summary: string;
  vehicleDetails?: VehicleDetails;
  serviceType?: string;
  location?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface CreateTicketInput {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  summary: string;
  vehicleDetails?: VehicleDetails;
  serviceType?: string;
  location?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}
