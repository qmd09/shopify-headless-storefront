import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, MapPin, Clock, Car, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Config ────────────────────────────────────────────────────────────────────

const SERVICE_MAP: Record<string, { label: string; price: number; duration: string }> = {
  wof: { label: 'Warrant of Fitness (WoF)', price: 99, duration: '~45 mins' },
  standard: { label: 'Standard Vehicle Service', price: 199, duration: '~2 hours' },
  premium: { label: 'Premium Vehicle Service', price: 349, duration: '~3.5 hours' },
};

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

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'mock.shop';
const SHOPIFY_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

// ─── Form state ────────────────────────────────────────────────────────────────

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
  location: '',
  date: '',
  timeSlot: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  rego: '',
  make: '',
  model: '',
  year: '',
  notes: '',
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

// ─── Shopify helpers ───────────────────────────────────────────────────────────

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

// Matches serviceType key to a product from the Hub Service catalogue
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
      const variantNode = p.variants.edges[0]?.node;
      if (variantNode) return { variantId: variantNode.id, productTitle: p.title, price: variantNode.price.amount };
    }
  }
  return null;
}

// ─── Booking phase type ────────────────────────────────────────────────────────

type BookingPhase =
  | 'idle'
  | 'finding-product'
  | 'creating-cart'
  | 'redirecting'
  | 'error-no-product'
  | 'error-cart';

const PHASE_LABELS: Partial<Record<BookingPhase, string>> = {
  'finding-product': 'Finding service product…',
  'creating-cart': 'Creating Shopify cart…',
  redirecting: 'Redirecting to Shopify checkout…',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const serviceType = searchParams.get('type') || 'wof';
  const service = SERVICE_MAP[serviceType] ?? SERVICE_MAP.wof;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [phase, setPhase] = useState<BookingPhase>('idle');

  const submitting = phase !== 'idle' && !phase.startsWith('error');

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Partial<FormData> = {};
    if (!form.location) e.location = 'Please select a location';
    if (!form.date) e.date = 'Please select a date';
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

  // ── Confirm booking — Shopify Cart flow ─────────────────────────────────────

  async function handleConfirm() {
    setPhase('finding-product');

    try {
      // 1. Query Shopify for Hub Service products
      const data = await shopifyQuery(`{
        products(first: 10, query: "product_type:Hub Service") {
          edges {
            node {
              title
              handle
              variants(first: 1) {
                edges {
                  node {
                    id
                    price { amount }
                  }
                }
              }
            }
          }
        }
      }`);

      const productNodes = (data?.products?.edges ?? []).map(
        (e: { node: { title: string; variants: { edges: Array<{ node: { id: string; price: { amount: string } } }> } } }) => e.node
      );
      const matched = matchVariant(productNodes, serviceType);

      if (!matched) {
        setPhase('error-no-product');
        return;
      }

      // 2. Generate booking reference
      const bookingRef = `BOOK-${Date.now()}`;
      const orderNumber = `#HUB-${Math.floor(Math.random() * 9000 + 1000)}`;

      // 3. Create Shopify cart with line item attributes
      setPhase('creating-cart');

      const cartData = await shopifyQuery(
        `mutation CartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
              totalQuantity
            }
            userErrors { field message }
          }
        }`,
        {
          input: {
            lines: [
              {
                merchandiseId: matched.variantId,
                quantity: 1,
                attributes: [
                  { key: 'Booking Ref', value: bookingRef },
                  { key: 'Service Type', value: serviceType },
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
              },
            ],
          },
        }
      );

      const cart = cartData?.cartCreate?.cart;
      const userErrors = cartData?.cartCreate?.userErrors ?? [];

      if (!cart || userErrors.length > 0) {
        console.error('Cart errors:', userErrors);
        setPhase('error-cart');
        return;
      }

      // 4. Persist booking data for the confirmation page (in case user comes back)
      sessionStorage.setItem(
        `booking_${bookingRef}`,
        JSON.stringify({
          ref: bookingRef,
          orderNumber,
          serviceType,
          serviceLabel: matched.productTitle,
          price: matched.price,
          duration: service.duration,
          location: form.location,
          date: form.date,
          timeSlot: form.timeSlot,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          rego: form.rego.toUpperCase(),
          make: form.make,
          model: form.model,
          year: form.year,
          cartId: cart.id,
          checkoutUrl: cart.checkoutUrl,
        })
      );

      // 5. Redirect to Shopify checkout
      setPhase('redirecting');
      window.location.href = cart.checkoutUrl;
    } catch (err) {
      console.error('Booking error:', err);
      setPhase('error-cart');
    }
  }

  // ── Shared input styles ─────────────────────────────────────────────────────

  const inputCls = (err?: string) =>
    cn(
      'w-full rounded-md border px-3 py-2 text-sm text-slate-800 outline-none transition-colors',
      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      err
        ? 'border-red-400 bg-red-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    );

  const fieldCls = 'flex flex-col gap-1';
  const labelCls = 'text-sm font-medium text-slate-700';
  const errCls = 'text-xs text-red-600';

  // Shared button classes for consistent sizing across all steps
  const btnBack = cn(
    'inline-flex items-center justify-center h-11 px-6 rounded-md text-sm font-medium transition-colors',
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
  );
  const btnNext = cn(
    'inline-flex items-center justify-center h-11 px-6 rounded-md text-sm font-medium transition-colors',
    'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Book a Hub Service</h1>
        <p className="text-slate-500 text-sm mt-1">
          {service.label} · <span className="font-semibold text-slate-700">${service.price}</span>{' '}
          · {service.duration}
        </p>
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
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : num}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 text-center leading-tight max-w-[70px]',
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                    step > num ? 'bg-green-500' : 'bg-slate-200'
                  )}
                />
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
            <select
              className={inputCls(errors.location)}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            >
              <option value="">Select a MotorHub location…</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
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
                <button
                  key={t}
                  type="button"
                  onClick={() => set('timeSlot', t)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    form.timeSlot === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.timeSlot && <p className={errCls}>{errors.timeSlot}</p>}
          </div>

          {/* Step 1 nav — Next only */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Registration (Rego)</label>
              <input className={inputCls(errors.rego)} value={form.rego}
                onChange={(e) => set('rego', e.target.value.toUpperCase())}
                placeholder="ABC123" maxLength={10} />
              {errors.rego && <p className={errCls}>{errors.rego}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Make</label>
              <input className={inputCls(errors.make)} value={form.make}
                onChange={(e) => set('make', e.target.value)} placeholder="Toyota" />
              {errors.make && <p className={errCls}>{errors.make}</p>}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Model</label>
              <input className={inputCls(errors.model)} value={form.model}
                onChange={(e) => set('model', e.target.value)} placeholder="Corolla" />
              {errors.model && <p className={errCls}>{errors.model}</p>}
            </div>
          </div>

          <div className={cn(fieldCls, 'sm:max-w-[160px]')}>
            <label className={labelCls}>Year</label>
            <input type="number" className={inputCls(errors.year)} value={form.year}
              onChange={(e) => set('year', e.target.value)} placeholder="2018"
              min={1990} max={2026} />
            {errors.year && <p className={errCls}>{errors.year}</p>}
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>
              Special Notes{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              className={cn(inputCls(), 'resize-none h-20')}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Dashboard warning light, unusual noise from front-left wheel…"
            />
          </div>

          {/* Step 2 nav — Back + Next, same height, mobile stacks with Next on top */}
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
          {/* Summary card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">
                Booking Summary
              </p>
              <p className="text-lg font-bold">{service.label}</p>
              <p className="text-blue-200 text-sm">{service.duration}</p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm">
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Location</dt>
                <dd className="font-medium text-slate-800">{form.location}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Appointment</dt>
                <dd className="font-medium text-slate-800">
                  {form.date} at {form.timeSlot}
                </dd>
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
              <span className="text-xl font-bold text-blue-700">${service.price}</span>
            </div>
          </div>

          {/* Error: no product found */}
          {phase === 'error-no-product' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Service product not found in Shopify</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Hub Service products (product_type: "Hub Service") were not found on this storefront.
                  Please contact support or try a different environment.
                </p>
                <button
                  onClick={() => setPhase('idle')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* Error: cart creation failed */}
          {phase === 'error-cart' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Cart creation failed</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Could not create a Shopify cart. Check the browser console for details.
                </p>
                <button
                  onClick={() => setPhase('idle')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* Info banner */}
          {phase === 'idle' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>What happens next:</strong> Confirming will query Shopify for the service
              product, create a cart with your booking details as line item attributes, then redirect
              you to Shopify checkout. The order webhook fires a ServiceNow job card automatically.
            </div>
          )}

          {/* Phase progress banner (while submitting) */}
          {submitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-sm text-blue-800">
              <svg className="animate-spin h-4 w-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {PHASE_LABELS[phase]}
            </div>
          )}

          {/* Step 3 nav — Back + Confirm, same height, mobile stacks with Confirm on top */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <button
              onClick={() => { setPhase('idle'); setStep(2); }}
              disabled={submitting}
              className={cn(btnBack, 'disabled:opacity-50 disabled:cursor-not-allowed')}
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || phase.startsWith('error')}
              className={btnNext}
            >
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
