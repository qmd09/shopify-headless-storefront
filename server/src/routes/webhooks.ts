import { Router, Request, Response } from 'express';
import { createTicket } from '../services/ticketStore';
import type { Ticket } from '../types/ticket';

const router = Router();

// ─── Shared processing logic ──────────────────────────────────────────────────

interface ShopifyOrderPayload {
  id: number | string;
  name?: string;
  order_number?: string;
  email?: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  billing_address?: { name?: string };
  total_price?: string;
  currency?: string;
  line_items?: Array<{
    title?: string;
    price?: string;
    properties?: Array<{ name: string; value: string }>;
  }>;
}

function processOrderToTicket(order: ShopifyOrderPayload): Ticket {
  // Resolve customer name: customer object → billing_address.name → fallback
  const customerName =
    order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : order.billing_address?.name || 'Unknown Customer';

  const customerEmail =
    order.email || order.customer?.email || 'unknown@example.com';

  const orderNumber = order.name || order.order_number || String(order.id);
  const totalPrice = order.total_price || '0.00';
  const currency = order.currency || 'NZD';

  // Extract line item properties (Hub booking attributes stored as Shopify line item properties)
  const firstLine = order.line_items?.[0];
  const props: Record<string, string> = {};
  for (const p of firstLine?.properties ?? []) {
    props[p.name] = p.value;
  }

  const ticket = createTicket({
    orderId: String(order.id),
    orderNumber: String(orderNumber),
    customerEmail,
    customerName,
    summary:
      props['Booking Ref']
        ? `Hub Service Booking — ${firstLine?.title ?? 'Service'} at ${props['Location'] ?? 'TBC'} on ${props['Appointment Date'] ?? 'TBC'} at ${props['Appointment Time'] ?? 'TBC'}. Booking Ref: ${props['Booking Ref']}.`
        : `New order ${orderNumber} received — ${currency} $${totalPrice}. Items: ${order.line_items?.length ?? 0}. Fulfillment required.`,
    ...(props['Service Type'] ? { serviceType: props['Service Type'] } : {}),
    ...(props['Location'] ? { location: props['Location'] } : {}),
    ...(props['Appointment Date'] ? { appointmentDate: props['Appointment Date'] } : {}),
    ...(props['Appointment Time'] ? { appointmentTime: props['Appointment Time'] } : {}),
    ...(props['Vehicle Rego']
      ? {
          vehicleDetails: {
            rego: props['Vehicle Rego'],
            make: props['Vehicle Make'] ?? '',
            model: props['Vehicle Model'] ?? '',
            year: parseInt(props['Vehicle Year'] ?? '0') || 0,
          },
        }
      : {}),
  });

  return ticket;
}

// ─── POST /webhooks/orders/created — real Shopify webhook ────────────────────

router.post('/orders/created', (req: Request, res: Response) => {
  const order = req.body as ShopifyOrderPayload;

  if (!order || !order.id) {
    res.status(400).json({ error: 'Invalid webhook payload' });
    return;
  }

  const ticket = processOrderToTicket(order);
  console.log(`[Webhook] orders/created → ServiceNow ticket ${ticket.id} for order ${ticket.orderNumber}`);
  res.status(200).json({ received: true, ticketId: ticket.id });
});

// ─── POST /webhooks/test-order — local test endpoint (no Shopify required) ───

router.post('/test-order', (req: Request, res: Response) => {
  const order = req.body as ShopifyOrderPayload;

  if (!order || !order.id) {
    res.status(400).json({ error: 'Payload must include an "id" field.' });
    return;
  }

  const ticket = processOrderToTicket(order);
  console.log(`[Webhook/test] test-order → ServiceNow ticket ${ticket.id} for order ${ticket.orderNumber}`);
  res.status(200).json({ success: true, ticket });
});

export default router;
