import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import servicenowRoutes from './routes/servicenow';
import webhookRoutes from './routes/webhooks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://shopify-headless-storefront-client.vercel.app',
      /\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/webhooks', webhookRoutes);
app.use('/api/servicenow', servicenowRoutes);

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Webhook endpoint: POST http://localhost:${PORT}/webhooks/orders/created`);
  console.log(`[Server] Tickets API:      GET  http://localhost:${PORT}/api/servicenow/tickets`);
});
