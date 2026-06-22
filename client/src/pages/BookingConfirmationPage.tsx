import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Ticket,
  ArrowRight,
  RefreshCw,
  MapPin,
  Calendar,
  Car,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'open' | 'confirmed' | 'in-progress' | 'quality-check' | 'completed';

interface ServiceNowTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: TicketStatus;
  createdAt: string;
  summary: string;
  serviceType?: string;
  location?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

interface BookingData {
  ref: string;
  orderNumber: string;
  serviceType: string;
  serviceLabel: string;
  price: number;
  duration: string;
  location: string;
  date: string;
  timeSlot: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rego: string;
  make: string;
  model: string;
  year: string;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: 'warning' | 'info' | 'purple' | 'orange' | 'success' }> = {
  open: { label: 'Open', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  'in-progress': { label: 'In Progress', variant: 'purple' },
  'quality-check': { label: 'Quality Check', variant: 'orange' },
  completed: { label: 'Completed', variant: 'success' },
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const MAX_ATTEMPTS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') ?? '';

  // Read booking data from sessionStorage (written by BookingPage on confirm)
  const bookingData: BookingData | null = (() => {
    try {
      const raw = sessionStorage.getItem(`booking_${ref}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [ticket, setTicket] = useState<ServiceNowTicket | null>(null);
  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ref) return;

    const fetchTicket = async () => {
      try {
        // GET /api/servicenow/tickets/:id supports lookup by orderId
        const res = await fetch(`${SERVER_URL}/api/servicenow/tickets/${encodeURIComponent(ref)}`);
        if (res.ok) {
          const found: ServiceNowTicket = await res.json();
          setTicket(found);
          setPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
      } catch {
        // Server may not be ready yet — keep polling
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

    fetchTicket();
    intervalRef.current = setInterval(fetchTicket, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ref]);

  const statusCfg = ticket ? STATUS_CONFIG[ticket.status] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* ── Confirmation header ────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Booking Confirmed!</h1>
        <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
          Your appointment has been booked and a ServiceNow job card has been automatically created
          for the workshop team.
        </p>
        {ref && (
          <div className="mt-4 inline-block bg-slate-100 border border-slate-200 rounded-lg px-4 py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Booking Reference</p>
            <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{ref}</p>
          </div>
        )}
      </div>

      {/* ── Booking summary ────────────────────────────────────────────────── */}
      {bookingData && (
        <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden">
          <div className="bg-blue-600 text-white px-5 py-3">
            <p className="font-semibold">{bookingData.serviceLabel}</p>
            <p className="text-blue-200 text-xs">{bookingData.duration} · ${bookingData.price}</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-xs">Location</p>
                <p className="font-medium text-slate-800">{bookingData.location}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-xs">Appointment</p>
                <p className="font-medium text-slate-800">
                  {bookingData.date} at {bookingData.timeSlot}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Car className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-xs">Vehicle</p>
                <p className="font-medium text-slate-800">
                  {bookingData.year} {bookingData.make} {bookingData.model}
                </p>
                <p className="text-slate-500 text-xs">Rego: {bookingData.rego}</p>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Customer</p>
              <p className="font-medium text-slate-800">
                {bookingData.firstName} {bookingData.lastName}
              </p>
              <p className="text-slate-500 text-xs">{bookingData.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ServiceNow job card ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">ServiceNow Job Card</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-2">Auto-generated</Badge>
            {polling && <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" />}
          </div>
        </div>

        <div className="p-5">
          {polling && !ticket ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                  Waiting for job card to be created…{' '}
                  <span className="text-slate-400 text-xs">
                    ({attempts}/{MAX_ATTEMPTS} checks)
                  </span>
                </span>
              </div>
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ) : ticket ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Ticket ID</dt>
                <dd className="font-mono font-semibold text-slate-800">{ticket.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Status</dt>
                <dd>
                  {statusCfg && (
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Job Reference</dt>
                <dd className="font-medium text-slate-800">{ticket.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Created</dt>
                <dd className="text-slate-700 text-xs">
                  {new Date(ticket.createdAt).toLocaleString('en-NZ', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
              <div className="col-span-full">
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Summary</dt>
                <dd className="text-slate-700 leading-relaxed">{ticket.summary}</dd>
              </div>
            </dl>
          ) : (
            <div className="text-center py-4 text-sm text-slate-500">
              <p>
                Job card not yet visible.{' '}
                <span className="text-slate-400 text-xs">
                  The server may need a moment — check the{' '}
                  <Link to="/admin/tickets" className="text-blue-600 hover:underline">
                    Admin Tickets
                  </Link>{' '}
                  page directly.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Integration explanation ────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-8">
        <strong>Integration flow:</strong> BookingPage POST'd to{' '}
        <code className="bg-blue-100 px-1 rounded text-xs">/api/servicenow/tickets</code>, which
        called <code className="bg-blue-100 px-1 rounded text-xs">createTicket()</code> in the
        in-memory store. This page then polls{' '}
        <code className="bg-blue-100 px-1 rounded text-xs">GET /api/servicenow/tickets/{'{orderId}'}</code>{' '}
        every 2 seconds (up to 10s) using the booking ref as the orderId lookup key.
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button asChild className="flex-1">
          <Link to="/book-service">
            Book Another Service <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link to="/admin/tickets">View All Tickets</Link>
        </Button>
      </div>

      {/* ── Demo mode callout ─────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Want to see the ServiceNow job card?
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
            In production, your job card is created automatically when payment completes. Use
            demo mode to simulate this.
          </p>
        </div>
        <Button variant="outline" asChild className="flex-shrink-0">
          <Link to="/demo">Open Demo Mode <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
