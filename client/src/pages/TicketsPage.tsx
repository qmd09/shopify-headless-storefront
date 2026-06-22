import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Ticket, PlusCircle, AlertTriangle, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

type TicketStatus = 'open' | 'confirmed' | 'in-progress' | 'quality-check' | 'completed';

interface VehicleDetails {
  rego: string;
  make: string;
  model: string;
  year: number;
}

interface ServiceNowTicket {
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

type BadgeVariant = 'warning' | 'info' | 'purple' | 'orange' | 'success' | 'secondary';

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: 'Open', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  'in-progress': { label: 'In Progress', variant: 'purple' },
  'quality-check': { label: 'Quality Check', variant: 'orange' },
  completed: { label: 'Completed', variant: 'success' },
};

const STATUS_CYCLE_LABEL: Record<TicketStatus, string> = {
  open: 'Confirm →',
  confirmed: 'Start Job →',
  'in-progress': 'Quality Check →',
  'quality-check': 'Complete →',
  completed: 'Re-open →',
};

const SERVICE_LABELS: Record<string, string> = {
  wof: 'WoF',
  standard: 'Standard Service',
  premium: 'Premium Service',
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function safeStatus(raw: string): TicketStatus {
  return (STATUS_CONFIG[raw as TicketStatus] ? raw : 'open') as TicketStatus;
}

// ─── Re-open confirmation dialog ──────────────────────────────────────────────

function ReopenDialog({
  ticketId,
  onConfirm,
  onCancel,
}: {
  ticketId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Re-open Job Card?</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-1">
          Ticket <span className="font-mono text-slate-700">{ticketId}</span> is currently{' '}
          <strong className="text-green-700">Completed</strong>.
        </p>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Re-opening will reset the status back to <strong>Open</strong> and restart the job card
          lifecycle. It will reappear in the active queue.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white border-0"
            onClick={onConfirm}
          >
            Yes, Re-open
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<ServiceNowTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReopenId, setConfirmReopenId] = useState<string | null>(null);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/servicenow/tickets`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: ServiceNowTicket[] = await res.json();
      setTickets(data);
    } catch {
      setError('Could not reach the Express server. Make sure it is running on port 3001.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    const id = setInterval(() => fetchTickets(true), 10_000);
    return () => clearInterval(id);
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(`${SERVER_URL}/api/servicenow/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated: ServiceNowTicket = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch {
      alert('Failed to update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Route action click: Re-open shows dialog, all others update directly
  const handleActionClick = (ticket: ServiceNowTicket) => {
    const status = safeStatus(ticket.status);
    if (status === 'completed') {
      setConfirmReopenId(ticket.id);
    } else {
      handleUpdateStatus(ticket.id);
    }
  };

  const handleCreateDemo = async () => {
    try {
      await fetch(`${SERVER_URL}/api/servicenow/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `DEMO-${Date.now()}`,
          orderNumber: `#DEMO-${Math.floor(Math.random() * 9000 + 1000)}`,
          customerEmail: 'demo@iag.co.nz',
          customerName: 'Demo User',
          summary: 'Manual demo ticket created from Admin Tickets page.',
        }),
      });
      await fetchTickets(true);
    } catch {
      alert('Failed to create demo ticket. Is the server running?');
    }
  };

  const statusCounts = (Object.keys(STATUS_CONFIG) as TicketStatus[]).reduce(
    (acc, s) => ({ ...acc, [s]: tickets.filter((t) => safeStatus(t.status) === s).length }),
    {} as Record<TicketStatus, number>
  );

  return (
    <>
      {/* Re-open confirmation dialog */}
      {confirmReopenId && (
        <ReopenDialog
          ticketId={confirmReopenId}
          onConfirm={() => {
            handleUpdateStatus(confirmReopenId);
            setConfirmReopenId(null);
          }}
          onCancel={() => setConfirmReopenId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">ServiceNow Job Cards</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Auto-generated from Shopify webhooks &amp; Hub Service bookings · refreshes every 10s
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => fetchTickets(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleCreateDemo}>
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Create Demo
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-300 rounded-xl">
            <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No tickets yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Book a service or trigger a Shopify webhook to create tickets.
            </p>
            <Button variant="outline" size="sm" onClick={handleCreateDemo}>
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Create Demo Ticket
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Ticket ID', 'Order', 'Customer', 'Service Type', 'Appointment', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => {
                    const status = safeStatus(ticket.status);
                    const { label, variant } = STATUS_CONFIG[status];
                    const isUpdating = updatingId === ticket.id;
                    const serviceLabel = ticket.serviceType
                      ? (SERVICE_LABELS[ticket.serviceType] ?? ticket.serviceType)
                      : null;
                    const isCompleted = status === 'completed';

                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {ticket.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-slate-800">{ticket.orderNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 truncate max-w-[140px]">{ticket.customerName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[140px]">{ticket.customerEmail}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {serviceLabel ? (
                            <Badge variant="secondary">{serviceLabel}</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {ticket.appointmentDate ? (
                            <div>
                              <p>{ticket.appointmentDate}</p>
                              <p className="text-slate-400">{ticket.appointmentTime}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={variant}>{label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(ticket)}
                            disabled={isUpdating}
                            className={`text-xs ${isCompleted ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}`}
                          >
                            {isUpdating ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              STATUS_CYCLE_LABEL[status]
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-slate-100">
              {tickets.map((ticket) => {
                const status = safeStatus(ticket.status);
                const { label, variant } = STATUS_CONFIG[status];
                const isUpdating = updatingId === ticket.id;
                const serviceLabel = ticket.serviceType
                  ? (SERVICE_LABELS[ticket.serviceType] ?? ticket.serviceType)
                  : null;
                const isCompleted = status === 'completed';

                return (
                  <div key={ticket.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-slate-500">{ticket.id}</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{ticket.orderNumber}</p>
                      </div>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {ticket.customerName}{' '}
                      <span className="text-slate-400">· {ticket.customerEmail}</span>
                    </p>
                    {serviceLabel && (
                      <p className="text-xs text-slate-500">
                        Service: <Badge variant="secondary" className="ml-1">{serviceLabel}</Badge>
                      </p>
                    )}
                    {ticket.appointmentDate && (
                      <p className="text-xs text-slate-500">
                        {ticket.appointmentDate} at {ticket.appointmentTime}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleString('en-NZ', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full text-xs mt-1 ${isCompleted ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}`}
                      onClick={() => handleActionClick(ticket)}
                      disabled={isUpdating}
                    >
                      {isUpdating && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                      {STATUS_CYCLE_LABEL[status]}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status summary strip */}
        {tickets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="text-slate-500">
              Total: <strong className="text-slate-700">{tickets.length}</strong>
            </span>
            {(Object.entries(STATUS_CONFIG) as [TicketStatus, { label: string; variant: BadgeVariant }][]).map(
              ([key, { label }]) =>
                statusCounts[key] > 0 ? (
                  <span key={key} className="text-slate-500">
                    {label}: <strong className="text-slate-700">{statusCounts[key]}</strong>
                  </span>
                ) : null
            )}
          </div>
        )}
      </div>
    </>
  );
}
