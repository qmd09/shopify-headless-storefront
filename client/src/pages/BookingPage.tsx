import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Car,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Wrench,
  Star,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

// ─── Service catalogue ─────────────────────────────────────────────────────────

const SERVICE_CATALOGUE = [
  {
    type: 'wof',
    icon: ShieldCheck,
    title: 'Warrant of Fitness (WoF)',
    price: 99,
    duration: '~45 mins',
    description: 'Certified WoF inspection by qualified technicians at your nearest AMI MotorHub.',
    featured: false,
  },
  {
    type: 'standard',
    icon: Wrench,
    title: 'Standard Vehicle Service',
    price: 199,
    duration: '~2 hours',
    description: 'Oil change, filter replacement, fluid top-ups and comprehensive vehicle inspection.',
    featured: true,
  },
  {
    type: 'premium',
    icon: Star,
    title: 'Premium Vehicle Service',
    price: 349,
    duration: '~3.5 hours',
    description: 'Full service including brake inspection, tyre rotation and complete diagnostics.',
    featured: false,
  },
];

type ServiceType = 'wof' | 'standard' | 'premium';

const SERVICE_MAP = Object.fromEntries(
  SERVICE_CATALOGUE.map((s) => [s.type, { label: s.title, price: s.price, duration: s.duration }])
) as Record<ServiceType, { label: string; price: number; duration: string }>;

// ─── Form config ───────────────────────────────────────────────────────────────

const LOCATIONS = [
  'AMI MotorHub Auckland (Hobsonville)',
  'AMI MotorHub Auckland (East Tamaki)',
  'AMI MotorHub Wellington (Ngauranga)',
  'AMI MotorHub Christchurch (Moorhouse Ave)',
];

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM',
];

const STEPS = ['Location & Time', 'Vehicle Details', 'Review & Confirm'];

// Max date: ~1 year ahead (browsers also enforce min/max, this validates typed values)
const MAX_BOOKING_DATE = '2027-12-31';

// ─── Shopify helpers ───────────────────────────────────────────────────────────

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'mock.shop';
const SHOPIFY_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

function shopifyHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SHOPIFY_TOKEN) h['X-Shopify-Storefront-Access-Token'] = SHOPIFY_TOKEN;
  return h;
}

async function shopifyQuery(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_URL, {
    method: 'POST',
    headers: shopifyHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'GraphQL error');
  return json.data;
}

function matchVariant(
  products: Array<{ title: string; variants: { edges: Array<{ node: { id: string; price: { amount: string } } }> } }>,
  serviceType: string
): { variantId: string; productTitle: string; price: string } | null {
  const matchers: Record<string, (t: string) => boolean> = {
    wof: (t) => /warrant|wof/i.test(t),
    standard: (t) => /standard/i.test(t),
    premium: (t) => /premium/i.test(t),
  };
  const match = matchers[serviceType];
  if (!match) return null;
  for (const p of products) {
    if (match(p.title)) {
      const node = p.variants.edges[0]?.node;
      if (node) return { variantId: node.id, productTitle: p.title, price: node.price.amount };
    }
  }
  return null;
}

// ─── Form types ────────────────────────────────────────────────────────────────

interface FormData {
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
  notes: string;
}

const EMPTY_FORM: FormData = {
  location: '', date: '', timeSlot: '',
  firstName: '', lastName: '', email: '', phone: '',
  rego: '', make: '', model: '', year: '', notes: '',
};

// Demo data for fast presentation filling
const DEMO_FORM: FormData = {
  location: 'AMI MotorHub Auckland (Hobsonville)',
  date: '2026-08-15',
  timeSlot: '10:00 AM',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@iag.co.nz',
  phone: '021 123 4567',
  rego: 'ABC123',
  make: 'Toyota',
  model: 'Corolla',
  year: '2019',
  notes: 'Dashboard warning light on. Possible brake squeal from front-left.',
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

// ─── Booking phase ─────────────────────────────────────────────────────────────

type BookingPhase = 'idle' | 'finding-product' | 'creating-cart' | 'redirecting' | 'creating-ticket' | 'error-cart';

const PHASE_LABELS: Partial<Record<BookingPhase, string>> = {
  'finding-product': 'Checking Shopify catalogue…',
  'creating-cart': 'Creating Shopify cart…',
  redirecting: 'Redirecting to Shopify checkout…',
  'creating-ticket': 'Creating job card…',
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [searchParams] = useSearchParams();

  // selectedService: initialise from URL param if valid, otherwise null (show selection screen)
  const typeParam = searchParams.get('type') as ServiceType | null;
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    typeParam && SERVICE_MAP[typeParam] ? typeParam : null
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [phase, setPhase] = useState<BookingPhase>('idle');

  const service = selectedService ? SERVICE_MAP[selectedService] : null;
  const submitting = phase !== 'idle' && !phase.startsWith('error');

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  function fillDemoData() {
    setForm(DEMO_FORM);
    setErrors({});
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Partial<FormData> = {};
    if (!form.location) e.location = 'Please select a location';
    if (!form.date) {
      e.date = 'Please select a date';
    } else {
      const year = parseInt(form.date.split('-')[0], 10);
      if (year < 2024 || year > 2027) e.date = 'Please choose a date between today and 2027';
    }
    if (!form.timeSlot) e.timeSlot = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.rego.trim()) e.rego = 'Required';
    if (!form.make.trim()) e.make = 'Required';
    if (!form.model.trim()) e.model = 'Required';
    const yr = parseInt(form.year);
    if (!form.year || isNaN(yr) || yr < 1990 || yr > 2026)
      e.year = 'Enter a year between 1990–2026';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  // ── Confirm — Shopify Cart flow with ServiceNow fallback ───────────────────
  //
  // Primary path (real Shopify store): find Hub Service product → cartCreate
  //   with line item attributes → redirect to checkoutUrl.
  // Fallback (mock.shop / no Hub Service products): POST directly to the
  //   ServiceNow server and navigate to /booking-confirmation. This keeps the
  //   demo working end-to-end without requiring Shopify product configuration.

  async function handleConfirm() {
    if (!selectedService || !service) return;
    const bookingRef = `BOOK-${Date.now()}`;
    const orderNumber = `#HUB-${Math.floor(Math.random() * 9000 + 1000)}`;

    const bookingBase = {
      ref: bookingRef, orderNumber,
      serviceType: selectedService, serviceLabel: service.label,
      price: service.price, duration: service.duration,
      location: form.location, date: form.date, timeSlot: form.timeSlot,
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone,
      rego: form.rego.toUpperCase(), make: form.make, model: form.model, year: form.year,
    };

    setPhase('finding-product');
    try {
      // ── Try Shopify path ──────────────────────────────────────────────────
      const data = await shopifyQuery(`{
        products(first: 10, query: "product_type:Hub Service") {
          edges {
            node {
              title
              handle
              variants(first: 1) {
                edges { node { id price { amount } } }
              }
            }
          }
        }
      }`);

      const productNodes = (data?.products?.edges ?? []).map(
        (e: { node: { title: string; variants: { edges: Array<{ node: { id: string; price: { amount: string } } }> } } }) => e.node
      );
      const matched = matchVariant(productNodes, selectedService);

      if (matched) {
        // Hub Service product found — create Shopify cart and redirect to checkout
        setPhase('creating-cart');
        const cartData = await shopifyQuery(
          `mutation CartCreate($input: CartInput!) {
            cartCreate(input: $input) {
              cart { id checkoutUrl totalQuantity }
              userErrors { field message }
            }
          }`,
          {
            input: {
              lines: [{
                merchandiseId: matched.variantId,
                quantity: 1,
                attributes: [
                  { key: 'Booking Ref', value: bookingRef },
                  { key: 'Service Type', value: selectedService },
                  { key: 'Location', value: form.location },
                  { key: 'Appointment Date', value: form.date },
                  { key: 'Appointment Time', value: form.timeSlot },
                  { key: 'Vehicle Rego', value: form.rego.toUpperCase() },
                  { key: 'Vehicle Make', value: form.make },
                  { key: 'Vehicle Model', value: form.model },
                  { key: 'Vehicle Year', value: form.year },
                  { key: 'Customer Phone', value: form.phone },
                  { key: 'Customer Name', value: `${form.firstName} ${form.lastName}` },
                  { key: 'Customer Email', value: form.email },
                ],
              }],
            },
          }
        );

        const cart = cartData?.cartCreate?.cart;
        const userErrors = cartData?.cartCreate?.userErrors ?? [];
        if (!cart || userErrors.length > 0) { setPhase('error-cart'); return; }

        sessionStorage.setItem(`booking_${bookingRef}`, JSON.stringify({
          ...bookingBase,
          serviceLabel: matched.productTitle,
          price: matched.price,
          cartId: cart.id,
          checkoutUrl: cart.checkoutUrl,
        }));

        setPhase('redirecting');
        window.location.href = cart.checkoutUrl;
        return;
      }
    } catch (err) {
      // Shopify query failed (network error, bad token, etc.) — fall through to server path
      console.warn('Shopify product lookup failed, using server fallback:', err);
    }

    // ── Fallback: POST directly to ServiceNow server ──────────────────────
    // Used when mock.shop or a store without Hub Service products is configured.
    setPhase('creating-ticket');
    try {
      const res = await fetch(`${SERVER_URL}/api/servicenow/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: bookingRef,
          orderNumber,
          customerName: `${form.firstName} ${form.lastName}`,
          customerEmail: form.email,
          summary: `Hub Service Booking — ${service.label} at ${form.location} on ${form.date} at ${form.timeSlot}`,
          vehicleDetails: {
            rego: form.rego.toUpperCase(),
            make: form.make,
            model: form.model,
            year: parseInt(form.year),
          },
          serviceType: selectedService,
          location: form.location,
          appointmentDate: form.date,
          appointmentTime: form.timeSlot,
        }),
      });

      if (!res.ok) throw new Error('Server error');

      sessionStorage.setItem(`booking_${bookingRef}`, JSON.stringify(bookingBase));

      // Navigate to confirmation page — it will poll for the ticket by bookingRef
      window.location.href = `/booking-confirmation?ref=${bookingRef}`;
    } catch {
      setPhase('error-cart');
    }
  }

  // ── Shared styles ───────────────────────────────────────────────────────────

  const inputCls = (err?: string) =>
    cn(
      'w-full rounded-md border px-3 py-2 text-sm text-slate-800 outline-none transition-colors',
      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
    );

  const fieldCls = 'flex flex-col gap-1';
  const labelCls = 'text-sm font-medium text-slate-700';
  const errCls = 'text-xs text-red-600';

  const btnBack = cn(
    'inline-flex items-center justify-center h-11 px-6 rounded-md text-sm font-medium transition-colors',
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
  );
  const btnNext = cn(
    'inline-flex items-center justify-center h-11 px-6 rounded-md text-sm font-medium transition-colors',
    'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
  );

  // ── Service selection screen ────────────────────────────────────────────────

  if (!selectedService) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Book a Hub Service</h1>
          <p className="text-slate-500 text-sm mt-1">
            Select the service you'd like to book at an AMI MotorHub location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {SERVICE_CATALOGUE.map(({ type, icon: Icon, title, price, duration, description, featured }) => (
            <button
              key={type}
              onClick={() => setSelectedService(type as ServiceType)}
              className={cn(
                'text-left rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-md',
                featured
                  ? 'border-2 border-blue-600 bg-white shadow-sm'
                  : 'border border-slate-200 bg-white hover:border-blue-300'
              )}
            >
              {featured && (
                <span className="self-start text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Most Popular
                </span>
              )}
              <div className="flex items-start justify-between">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', featured ? 'bg-blue-100' : 'bg-slate-100')}>
                  <Icon className={cn('h-5 w-5', featured ? 'text-blue-600' : 'text-slate-600')} />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800">${price}</p>
                  <p className="text-xs text-slate-400">{duration}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              </div>
              <div className={cn('mt-auto flex items-center justify-center gap-1 h-9 rounded-lg text-sm font-medium transition-colors', featured ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
                Select <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Form (steps 1–3) ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Page heading + demo fill + service badge */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Book a Hub Service</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="info" className="text-xs">{service?.label}</Badge>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-slate-500 text-xs">${service?.price} · {service?.duration}</span>
            <button
              onClick={() => { setSelectedService(null); setStep(1); setForm(EMPTY_FORM); setErrors({}); setPhase('idle'); }}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Change service
            </button>
          </div>
        </div>
        <button
          onClick={fillDemoData}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
          title="Auto-fill all fields with demo data for presentation"
        >
          <Zap className="h-3.5 w-3.5" /> Fill Demo
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex items-start mb-10">
        {STEPS.map((label, idx) => {
          const num = idx + 1;
          const isCompleted = step > num;
          const isActive = step === num;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  isCompleted ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : num}
                </div>
                <span className={cn('text-xs mt-1.5 text-center leading-tight max-w-[70px]', isActive ? 'text-blue-600 font-semibold' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 mb-5 transition-colors', step > num ? 'bg-green-500' : 'bg-slate-200')} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Location & Time ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className={fieldCls}>
            <label className={labelCls}>
              <MapPin className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
              Location
            </label>
            <select className={inputCls(errors.location)} value={form.location} onChange={(e) => set('location', e.target.value)}>
              <option value="">Select a MotorHub location…</option>
              {LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            {errors.location && <p className={errCls}>{errors.location}</p>}
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              className={inputCls(errors.date)}
              value={form.date}
              min={todayIso()}
              max={MAX_BOOKING_DATE}
              onChange={(e) => set('date', e.target.value)}
            />
            {errors.date && <p className={errCls}>{errors.date}</p>}
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>
              <Clock className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
              Time Slot
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TIME_SLOTS.map((t) => (
                <button key={t} type="button" onClick={() => set('timeSlot', t)}
                  className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    form.timeSlot === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.timeSlot && <p className={errCls}>{errors.timeSlot}</p>}
          </div>

          <div className="pt-4">
            <button onClick={nextStep} className={btnNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Vehicle Details ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>First Name</label>
              <input className={inputCls(errors.firstName)} value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" />
              {errors.firstName && <p className={errCls}>{errors.firstName}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Last Name</label>
              <input className={inputCls(errors.lastName)} value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)} placeholder="Smith" />
              {errors.lastName && <p className={errCls}>{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls(errors.email)} value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="jane.smith@iag.co.nz" />
              {errors.email && <p className={errCls}>{errors.email}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Phone</label>
              <input type="tel" className={inputCls(errors.phone)} value={form.phone}
                onChange={(e) => set('phone', e.target.value)} placeholder="021 123 4567" />
              {errors.phone && <p className={errCls}>{errors.phone}</p>}
            </div>
          </div>

          <hr className="border-slate-200" />

          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Car className="h-4 w-4 text-blue-500" /> Vehicle Details
          </p>

          {/* 2 per row: rego + make */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Registration (Rego)</label>
              <input className={inputCls(errors.rego)} value={form.rego}
                onChange={(e) => set('rego', e.target.value.toUpperCase())}
                onInput={(e) => { const el = e.currentTarget; el.value = el.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6); }}
                placeholder="ABC123" maxLength={6} />
              {errors.rego && <p className={errCls}>{errors.rego}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Make</label>
              <input className={inputCls(errors.make)} value={form.make}
                onChange={(e) => set('make', e.target.value)} placeholder="Toyota" />
              {errors.make && <p className={errCls}>{errors.make}</p>}
            </div>
          </div>

          {/* 2 per row: model + year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Model</label>
              <input className={inputCls(errors.model)} value={form.model}
                onChange={(e) => set('model', e.target.value)} placeholder="Corolla" />
              {errors.model && <p className={errCls}>{errors.model}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Year</label>
              <input type="number" className={inputCls(errors.year)} value={form.year}
                onChange={(e) => set('year', e.target.value)}
                onInput={(e) => { const el = e.currentTarget; if (el.value.length > 4) el.value = el.value.slice(0, 4); if (el.value.length === 4 && parseInt(el.value) > 2026) el.value = '2026'; }}
                placeholder="2019" min={1990} max={2026} />
              {errors.year && <p className={errCls}>{errors.year}</p>}
            </div>
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>
              Special Notes{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea className={cn(inputCls(), 'resize-none h-20')} value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Dashboard warning light, unusual noise from front-left wheel…" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
            <button onClick={() => setStep(1)} className={btnBack}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </button>
            <button onClick={nextStep} className={btnNext}>
              Review Booking <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Confirm ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Booking Summary</p>
              <p className="text-lg font-bold">{service?.label}</p>
              <p className="text-blue-200 text-sm">{service?.duration}</p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm">
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Location</dt>
                <dd className="font-medium text-slate-800">{form.location}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Appointment</dt>
                <dd className="font-medium text-slate-800">{form.date} at {form.timeSlot}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Customer</dt>
                <dd className="font-medium text-slate-800">{form.firstName} {form.lastName}</dd>
                <dd className="text-slate-500">{form.email}</dd>
                <dd className="text-slate-500">{form.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Vehicle</dt>
                <dd className="font-medium text-slate-800">{form.year} {form.make} {form.model}</dd>
                <dd className="text-slate-500">Rego: {form.rego.toUpperCase()}</dd>
              </div>
              {form.notes && (
                <div className="col-span-full">
                  <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Notes</dt>
                  <dd className="text-slate-700">{form.notes}</dd>
                </div>
              )}
            </dl>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-xl font-bold text-blue-700">${service?.price}</span>
            </div>
          </div>

          {phase === 'error-cart' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Cart creation failed</p>
                <p className="text-xs text-red-600 mt-0.5">Check the browser console for details.</p>
                <button onClick={() => setPhase('idle')} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800">
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>What happens next:</strong> On a live Shopify store, this creates a cart with
              your booking as line item attributes and redirects to Shopify checkout — the order webhook
              then auto-creates a ServiceNow job card. On this demo storefront, the job card is created
              directly and you'll be taken to the booking confirmation page.
            </div>
          )}

          {submitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-sm text-blue-800">
              <svg className="animate-spin h-4 w-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {PHASE_LABELS[phase]}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <button onClick={() => { setPhase('idle'); setStep(2); }} disabled={submitting} className={btnBack}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </button>
            <button onClick={handleConfirm} disabled={submitting || phase === 'error-cart'} className={btnNext}>
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {PHASE_LABELS[phase] ?? 'Processing…'}
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
