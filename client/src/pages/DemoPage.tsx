import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = 'open' | 'confirmed' | 'in-progress' | 'quality-check' | 'completed';
type BadgeVariant = 'warning' | 'info' | 'purple' | 'orange' | 'success' | 'secondary';

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

interface DemoForm {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  serviceType: string;
  location: string;
  appointmentDate: string;
  appointmentTime: string;
  rego: string;
  make: string;
  model: string;
  year: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const SERVICE_MAP: Record<string, { label: string; price: string }> = {
  wof: { label: 'Warrant of Fitness (WoF)', price: '99.00' },
  standard: { label: 'Standard Vehicle Service', price: '199.00' },
  premium: { label: 'Premium Vehicle Service', price: '349.00' },
};

const SERVICE_OPTIONS = [
  { value: 'wof', label: 'WoF — Warrant of Fitness' },
  { value: 'standard', label: 'Standard Vehicle Service' },
  { value: 'premium', label: 'Premium Vehicle Service' },
];

const LOCATIONS = [
  'AMI MotorHub Auckland (Hobsonville)',
  'AMI MotorHub Auckland (East Tamaki)',
  'AMI RepairHub Wellington (Ngauranga)',
  'AMI MotorHub Christchurch (Moorhouse Ave)',
];

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
];

const SERVICE_LABELS: Record<string, string> = {
  wof: 'WoF',
  standard: 'Standard Service',
  premium: 'Premium Service',
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: 'Open', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  'in-progress': { label: 'In Progress', variant: 'purple' },
  'quality-check': { label: 'Quality Check', variant: 'orange' },
  completed: { label: 'Completed', variant: 'success' },
};

const FLOW_STEPS = ['Shopify Checkout', 'Order Webhook', 'Node.js Server', 'ServiceNow Job Card'];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const DEMO_PASSWORD = 'iag2026';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function safeStatus(raw: string): TicketStatus {
  return (STATUS_CONFIG[raw as TicketStatus] ? raw : 'open') as TicketStatus;
}

function defaultForm(): DemoForm {
  return {
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@iag.co.nz',
    orderNumber: '#HUB-1001',
    serviceType: 'wof',
    location: LOCATIONS[0],
    appointmentDate: tomorrowIso(),
    appointmentTime: '10:00 AM',
    rego: 'ABC123',
    make: 'Toyota',
    model: 'Corolla',
    year: '2019',
  };
}

// ─── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem('demo_authenticated', 'true');
      onAuth();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  }

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-sm w-full p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">IAG Hub Services</h1>
          <p className="text-slate-500 text-sm mt-1">Demo Access Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter demo password"
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Enter Demo
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('demo_authenticated') === 'true'
  );

  if (!authenticated) {
    return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  }

  return <DemoPanel />;
}

// ─── Demo panel ───────────────────────────────────────────────────────────────

function DemoPanel() {
  const [form, setForm] = useState<DemoForm>(defaultForm);
  const [simulating, setSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<ServiceNowTicket | null>(null);

  const [tickets, setTickets] = useState<ServiceNowTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const orderCounterRef = useRef(1001);
  const rightColRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch tickets ──────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/servicenow/tickets`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ServiceNowTicket[] = await res.json();
      setTickets(data.slice().reverse());
      setTicketsError(null);
    } catch {
      setTicketsError('Could not reach the Express server.');
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 5_000);
    return () => clearInterval(id);
  }, [fetchTickets]);

  // ── Simulate ───────────────────────────────────────────────────────────────

  const set = (field: keyof DemoForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    setSimulating(true);
    setSimulateError(null);
    setLastCreatedTicket(null);

    const id = Date.now();
    const svc = SERVICE_MAP[form.serviceType];

    const payload = {
      id,
      name: form.orderNumber,
      email: form.customerEmail,
      billing_address: { name: form.customerName },
      line_items: [
        {
          title: svc.label,
          price: svc.price,
          properties: [
            { name: 'Booking Ref', value: `BOOK-${id}` },
            { name: 'Service Type', value: form.serviceType },
            { name: 'Location', value: form.location },
            { name: 'Appointment Date', value: form.appointmentDate },
            { name: 'Appointment Time', value: form.appointmentTime },
            { name: 'Vehicle Rego', value: form.rego.toUpperCase() },
            { name: 'Vehicle Make', value: form.make },
            { name: 'Vehicle Model', value: form.model },
            { name: 'Vehicle Year', value: form.year },
            { name: 'Customer Name', value: form.customerName },
            { name: 'Customer Email', value: form.customerEmail },
          ],
        },
      ],
    };

    try {
      const res = await fetch(`${SERVER_URL}/webhooks/test-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const { ticket } = await res.json();

      setLastCreatedTicket(ticket);

      // Highlight new row and fade after 3s
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      setHighlightedId(ticket.id);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 3000);

      // Increment order counter
      orderCounterRef.current += 1;
      setForm((prev) => ({ ...prev, orderNumber: `#HUB-${orderCounterRef.current}` }));

      // Refresh ticket list immediately, then scroll to right column
      await fetchTickets();
      setTimeout(() => {
        rightColRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      setSimulateError('Failed to create job card. Is the Express server running on port 3001?');
    } finally {
      setSimulating(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';
  const selectCls = inputCls;
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Demo Mode</h1>
        </div>
        <p className="text-slate-500 text-sm ml-9">
          Simulate the Shopify → ServiceNow pipeline end-to-end without a real checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── LEFT: simulate form ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-1">
            Simulate Shopify Checkout Complete
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            This simulates what happens when a customer completes payment on Shopify — the order
            webhook fires and creates a ServiceNow job card automatically.
          </p>

          <form onSubmit={handleSimulate} className="space-y-5">
            {/* Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer Name</label>
                <input className={inputCls} value={form.customerName} onChange={(e) => set('customerName', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Customer Email</label>
                <input className={inputCls} type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} required />
              </div>
            </div>

            {/* Order + Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Order Number</label>
                <input className={inputCls} value={form.orderNumber} onChange={(e) => set('orderNumber', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Service Type</label>
                <select className={selectCls} value={form.serviceType} onChange={(e) => set('serviceType', e.target.value)}>
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Location</label>
                <select className={selectCls} value={form.location} onChange={(e) => set('location', e.target.value)}>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Appointment Date</label>
                <input className={inputCls} type="date" value={form.appointmentDate} min={tomorrowIso()} max="2027-12-31" onChange={(e) => set('appointmentDate', e.target.value)} required />
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Appointment Time</label>
                <select className={selectCls} value={form.appointmentTime} onChange={(e) => set('appointmentTime', e.target.value)}>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle — 2 per row */}
            <div>
              <p className={`${labelCls} mb-2`}>Vehicle Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Rego</label>
                  <input className={inputCls} value={form.rego} onChange={(e) => set('rego', e.target.value)} placeholder="ABC123" required />
                </div>
                <div>
                  <label className={labelCls}>Make</label>
                  <input className={inputCls} value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="Toyota" required />
                </div>
                <div>
                  <label className={labelCls}>Model</label>
                  <input className={inputCls} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Corolla" required />
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input className={inputCls} type="number" min="1990" max="2026" value={form.year} onChange={(e) => set('year', e.target.value)} onInput={(e) => { const el = e.currentTarget; if (el.value.length > 4) el.value = el.value.slice(0, 4); }} placeholder="2019" required />
                </div>
              </div>
            </div>

            {/* Success / error feedback */}
            {lastCreatedTicket && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Job card created successfully</p>
                  <p className="text-xs text-green-600 mt-0.5 font-mono">
                    Ticket ID: {lastCreatedTicket.id}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Scroll right to see it highlighted in the live ticket list.
                  </p>
                </div>
              </div>
            )}

            {simulateError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{simulateError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={simulating}
              className="w-full bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creating ServiceNow job card…
                </>
              ) : (
                <>
                  🚀 Simulate Checkout Complete &amp; Create Job Card
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: live tickets ─────────────────────────────────────────── */}
        <div ref={rightColRef}>
          {/* Integration flow diagram */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Integration Flow
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {FLOW_STEPS.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                    {step}
                  </span>
                  {i < FLOW_STEPS.length - 1 && (
                    <span className="text-slate-400 font-bold text-sm">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Ticket table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">ServiceNow Job Cards</h2>
                <p className="text-xs text-slate-400 mt-0.5">Auto-refreshes every 5 seconds</p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                <span className="text-xs font-semibold text-green-700">Live</span>
              </div>
            </div>

            {ticketsError ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-medium">Server unreachable</p>
                <p className="text-xs text-slate-400 mt-1">{ticketsError}</p>
              </div>
            ) : ticketsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-400 text-sm">No tickets yet — simulate a checkout above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Ticket ID', 'Order', 'Customer', 'Service', 'Appointment', 'Status', 'Created'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tickets.map((ticket) => {
                      const status = safeStatus(ticket.status);
                      const { label, variant } = STATUS_CONFIG[status];
                      const serviceLabel = ticket.serviceType
                        ? (SERVICE_LABELS[ticket.serviceType] ?? ticket.serviceType)
                        : null;
                      const isHighlighted = highlightedId === ticket.id;

                      return (
                        <tr
                          key={ticket.id}
                          className={`transition-colors duration-1000 ${
                            isHighlighted ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            {ticket.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                            {ticket.orderNumber}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 truncate max-w-[120px]">
                              {ticket.customerName}
                            </p>
                            <p className="text-slate-400 truncate max-w-[120px]">
                              {ticket.customerEmail}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {serviceLabel ? (
                              <Badge variant="secondary">{serviceLabel}</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">
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
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                            {timeAgo(ticket.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Link to admin */}
          <div className="mt-3 text-right">
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Open full admin panel <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
