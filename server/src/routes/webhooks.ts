import { Router, Request, Response } from 'express';
import { createTicket } from '../services/ticketStore';

const router = Router();

router.post('/orders/created', (req: Request, res: Response) => {
  const order = req.body;

  if (!order || !order.id) {
    res.status(400).json({ error: 'Invalid webhook payload' });
    return;
  }

  const customerName = order.customer
    ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
    : 'Unknown Customer';

  const customerEmail =
    order.email || order.customer?.email || 'unknown@example.com';

  const orderNumber = order.name || order.order_number || String(order.id);
  const totalPrice = order.total_price || '0.00';
  const currency = order.currency || 'NZD';

  const ticket = createTicket({
    orderId: String(order.id),
    orderNumber: String(orderNumber),
    customerEmail,
    customerName,
    summary: `New order ${orderNumber} received — ${currency} $${totalPrice}. Items: ${
      order.line_items?.length ?? 0
    }. Fulfillment required.`,
  });

  console.log(`[Webhook] Order created → ServiceNow ticket ${ticket.id} for order ${ticket.orderNumber}`);
  res.status(200).json({ received: true, ticketId: ticket.id });
});

export default router;
