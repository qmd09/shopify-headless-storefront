import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Ticket, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

interface ServiceNowTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: 'open' | 'processing' | 'closed';
  createdAt: string;
  summary: string;
}

const STATUS_CONFIG = {
  open: { label: 'Open', variant: 'warning' as const },
  processing: { label: 'Processing', variant: 'info' as const },
  closed: { label: 'Closed', variant: 'success' as const },
};

export default function OrderConfirmPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? searchParams.get('order_id');

  const [ticket, setTicket] = useState<ServiceNowTicket | null>(null);
  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  const MAX_ATTEMPTS = 5; // 5 × 2s = 10s

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${serverUrl}/api/servicenow/tickets`);
        if (!res.ok) return;
        const tickets: ServiceNowTicket[] = await res.json();

        const found = orderId
          ? tickets.find((t) => t.orderId === orderId || t.orderNumber === orderId)
          : tickets[0]; // demo fallback — show most recent ticket

        if (found) {
          setTicket(found);
          setPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
      } catch {
        // Server may not be running — fail silently
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          setPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return next;
      });
    };

    fetchTickets(); // immediate first call
    intervalRef.current = setInterval(fetchTickets, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusConfig = ticket ? STATUS_CONFIG[ticket.status] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Order Confirmed!</h1>
        <p className="text-slate-500 mt-2">
          Thank you for your order. A ServiceNow support ticket has been automatically created.
        </p>
        {orderId && (
          <p className="text-sm font-mono text-slate-400 mt-2">Order ref: {orderId}</p>
        )}
      </div>

      {/* ServiceNow ticket card */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            <CardTitle>ServiceNow Ticket</CardTitle>
            {polling && (
              <RefreshCw className="h-4 w-4 text-slate-400 animate-spin ml-auto" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {polling && !ticket ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>
                  Waiting for ticket…{' '}
                  <span className="text-slate-400">
                    ({attempts}/{MAX_ATTEMPTS} checks)
                  </span>
                </span>
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : ticket ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ticket ID</dt>
                <dd className="font-mono font-medium text-slate-800">{ticket.id}</dd>
              </div>

              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Status</dt>
                <dd>
                  {statusConfig && (
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Order Reference</dt>
                <dd className="font-medium text-slate-800">{ticket.orderNumber}</dd>
              </div>

              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Created</dt>
                <dd className="text-slate-700">
                  {new Date(ticket.createdAt).toLocaleString('en-NZ', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Customer</dt>
                <dd className="text-slate-700">{ticket.customerName}</dd>
              </div>

              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Email</dt>
                <dd className="text-slate-700 truncate">{ticket.customerEmail}</dd>
              </div>

              <div className="col-span-full">
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Summary</dt>
                <dd className="text-slate-700 leading-relaxed">{ticket.summary}</dd>
              </div>
            </dl>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">
                No ticket found yet.{' '}
                <span className="text-slate-400">
                  The server may need a webhook trigger — try the demo button below.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-8">
        <strong>How this works:</strong> When Shopify fires an{' '}
        <code className="bg-blue-100 px-1 rounded text-xs">orders/created</code> webhook, the
        Express server creates a ServiceNow ticket automatically. This page polls{' '}
        <code className="bg-blue-100 px-1 rounded text-xs">GET /api/servicenow/tickets</code>{' '}
        every 2 seconds for up to 10 seconds to display the result.
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link to="/products">
            Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link to="/admin/tickets">View All Tickets</Link>
        </Button>
      </div>
    </div>
  );
}
