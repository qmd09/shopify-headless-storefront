import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, MapPin, Clock, Car } from 'lucide-react';
import { Button } from '../components/ui/button';
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

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const serviceType = searchParams.get('type') || 'wof';
  const service = SERVICE_MAP[serviceType] ?? SERVICE_MAP.wof;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

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

  // ── Confirm booking ─────────────────────────────────────────────────────────

  async function handleConfirm() {
    setSubmitting(true);
    const bookingRef = `BOOK-${Date.now()}`;
    const orderNumber = `#HUB-${Math.floor(Math.random() * 9000 + 1000)}`;

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
          serviceType,
          location: form.location,
          appointmentDate: form.date,
          appointmentTime: form.timeSlot,
        }),
      });

      if (!res.ok) throw new Error('Server error');

      // Persist booking summary for confirmation page
      sessionStorage.setItem(
        `booking_${bookingRef}`,
        JSON.stringify({
          ref: bookingRef,
          orderNumber,
          serviceType,
          serviceLabel: service.label,
          price: service.price,
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
        })
      );

      navigate(`/booking-confirmation?ref=${bookingRef}`);
    } catch {
      alert('Booking failed — is the Express server running on port 3001?');
    } finally {
      setSubmitting(false);
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

      {/* Progress bar */}
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

          <div className="pt-4">
            <Button onClick={nextStep} size="lg" className="w-full sm:w-auto">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
            <label className={labelCls}>Special Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className={cn(inputCls(), 'resize-none h-20')}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Dashboard warning light, unusual noise from front-left wheel…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep} size="lg">
              Review Booking <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
                <dd className="font-medium text-slate-800">
                  {form.firstName} {form.lastName}
                </dd>
                <dd className="text-slate-500">{form.email}</dd>
                <dd className="text-slate-500">{form.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Vehicle</dt>
                <dd className="font-medium text-slate-800">
                  {form.year} {form.make} {form.model}
                </dd>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>What happens next:</strong> Confirming will POST to our ServiceNow integration
            server. A job card is created instantly and you'll see it on the confirmation page.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button size="lg" onClick={handleConfirm} disabled={submitting} className="flex-1 sm:flex-none">
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Confirming…
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
