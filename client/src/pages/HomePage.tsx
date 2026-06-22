import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Wrench,
  Star,
  Calendar,
  FileCheck,
  MapPin,
  ArrowRight,
  Check,
  ExternalLink,
  Boxes,
  Zap,
} from 'lucide-react';
import { useProducts } from '../hooks/useProduct';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { formatPrice } from '../lib/utils';

// ─── Static data ───────────────────────────────────────────────────────────────

const STATS = [
  { value: '4', label: 'Hub Locations' },
  { value: '300+', label: 'Approved Repairers' },
  { value: '48hr', label: 'Turnaround' },
  { value: 'Live', label: 'ServiceNow Integrated' },
];

const SERVICES = [
  {
    type: 'wof',
    icon: ShieldCheck,
    title: 'Warrant of Fitness',
    price: '$99',
    duration: '~45 mins',
    description:
      'Certified WoF inspection by qualified technicians at your nearest AMI MotorHub.',
    features: ['Digital inspection report', 'Component photographs provided', 'Same-day availability'],
    featured: false,
    label: 'Book WoF',
  },
  {
    type: 'standard',
    icon: Wrench,
    title: 'Standard Vehicle Service',
    price: '$199',
    duration: '~2 hours',
    description:
      'Oil change, filter replacement, fluid top-ups and comprehensive vehicle inspection.',
    features: ['OEM-quality parts', 'Digital service record', 'Courtesy car available'],
    featured: true,
    label: 'Book Standard',
  },
  {
    type: 'premium',
    icon: Star,
    title: 'Premium Vehicle Service',
    price: '$349',
    duration: '~3.5 hours',
    description:
      'Full service including brake inspection, tyre rotation and complete diagnostics.',
    features: ['Full brake inspection', 'Tyre rotation included', 'Priority scheduling'],
    featured: false,
    label: 'Book Premium',
  },
];

const HOW_IT_WORKS = [
  {
    icon: Calendar,
    step: '01',
    title: 'Book Online',
    description:
      'Select your service, location and time slot. Enter your vehicle details to complete the booking.',
  },
  {
    icon: Wrench,
    step: '02',
    title: 'We Take Care of It',
    description:
      'Drop off your vehicle. Our technicians get to work with real-time job card updates.',
  },
  {
    icon: FileCheck,
    step: '03',
    title: 'ServiceNow Job Card Created',
    description:
      'Every booking automatically creates a ServiceNow incident for full workflow tracking across all locations.',
  },
];

const HUB_LOCATIONS = [
  {
    city: 'Auckland',
    suburb: 'Hobsonville',
    address: '2 Hobsonville Point Road, Hobsonville, Auckland',
    services: ['WoF', 'Servicing', 'Collision Repair'],
    mapsQuery: '2+Hobsonville+Point+Road+Hobsonville+Auckland',
  },
  {
    city: 'Auckland',
    suburb: 'East Tamaki',
    address: '14 Accent Drive, East Tamaki, Auckland',
    services: ['WoF', 'Servicing', 'Collision Repair'],
    mapsQuery: '14+Accent+Drive+East+Tamaki+Auckland',
  },
  {
    city: 'Wellington',
    suburb: 'Ngauranga',
    address: 'AMI RepairHub Ngauranga, Wellington',
    services: ['WoF', 'Collision Repair'],
    mapsQuery: 'AMI+RepairHub+Ngauranga+Wellington',
  },
  {
    city: 'Christchurch',
    suburb: 'Moorhouse Ave',
    address: 'Moorhouse Ave, Christchurch',
    services: ['WoF', 'Servicing'],
    mapsQuery: 'Moorhouse+Ave+Christchurch',
  },
];

const FLOW_STEPS = ['Shopify Checkout', 'Order Webhook', 'Node.js Middleware', 'ServiceNow Job Card'];

// ─── Helper: deterministic card accent colour from product id ─────────────────

const PRODUCT_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
];

function productGradient(id: string): string {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PRODUCT_GRADIENTS[hash % PRODUCT_GRADIENTS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts(9);

  const catalogueProducts = products
    .filter((p) => !p.productType?.toLowerCase().includes('hub'))
    .slice(0, 3);

  return (
    <div>
      {/* ── SECTION 1: Hero ───────────────────────────────────────────────── */}
      <section
        className="bg-slate-900 text-white relative overflow-hidden"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 80px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
                Supply Chain &amp; Hub Services · NZ Division
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
                Book a Hub Service
              </h1>
              <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-xl">
                Vehicle repairs, servicing and WoF at AMI MotorHub locations across New Zealand.
                Every booking auto-generates a ServiceNow job card.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 border-0 font-semibold"
                  asChild
                >
                  <Link to="/book-service">
                    Book a Service <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent text-white border border-white/40 hover:bg-white/10 hover:border-white/60"
                  asChild
                >
                  <Link to="/admin/tickets">Track My Booking</Link>
                </Button>
              </div>
            </div>

            {/* Right — stats */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm"
                >
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-slate-400 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Service Cards ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-2">
              AMI MotorHub
            </p>
            <h2 className="text-3xl font-bold text-slate-800">Hub Services</h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">
              Transparent pricing, certified technicians, digital job cards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map(({ type, icon: Icon, title, price, duration, description, features, featured, label }) => (
              <div
                key={type}
                className={`bg-white rounded-2xl flex flex-col overflow-hidden transition-all hover:shadow-lg ${
                  featured
                    ? 'border-2 border-blue-600 shadow-md shadow-blue-100 ring-1 ring-blue-600/20'
                    : 'border border-slate-200'
                }`}
              >
                {featured && (
                  <div className="bg-blue-600 text-white text-xs font-semibold text-center py-1.5 tracking-wider uppercase">
                    Most Popular
                  </div>
                )}

                <div className="p-6 flex flex-col gap-5 flex-1">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        featured ? 'bg-blue-100' : 'bg-slate-100'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${featured ? 'text-blue-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">{price}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {duration}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg mb-1">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                  </div>

                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-auto"
                    variant={featured ? 'default' : 'outline'}
                    onClick={() => navigate(`/book-service?type=${type}`)}
                  >
                    {label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: How It Works ───────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
            <p className="text-slate-500 mt-2">From booking to job card in under 60 seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connecting line — visible on md+ */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-blue-100" />

            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="flex flex-col items-center text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 relative z-10">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Hub Locations ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-2">
                New Zealand
              </p>
              <h2 className="text-3xl font-bold text-slate-800">Hub Locations</h2>
            </div>
            <Badge variant="success" className="hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              All locations open
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HUB_LOCATIONS.map(({ city, suburb, address, services, mapsQuery }) => (
              <div
                key={`${city}-${suburb}`}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {city} — {suburb}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{address}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="flex-shrink-0 text-xs">Open</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4 ml-12">
                  {services.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <a
                  href={`https://maps.google.com/?q=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-12 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Get Directions <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: ServiceNow Integration Banner ──────────────────────── */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left — copy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold uppercase tracking-widest">
                  Integration
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Powered by ServiceNow Integration
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Every Hub Service booking automatically creates a ServiceNow job card. Operations
                teams get real-time visibility across all locations. No manual data entry. No missed
                jobs.
              </p>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 border-0"
                asChild
              >
                <Link to="/admin/tickets">
                  View Live Tickets <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right — flow diagram */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-5">
                Integration Flow
              </p>
              <div className="flex flex-col gap-3">
                {FLOW_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 font-medium">
                      {step}
                    </div>
                    {i < FLOW_STEPS.length - 1 && (
                      <span className="text-slate-500 text-xs ml-1">↓</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-5 text-center">
                Webhook fires on order.created · Node.js middleware · ServiceNow REST API
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Supply Store Teaser ────────────────────────────────── */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Boxes className="h-4.5 w-4.5 text-blue-600" />
                <span className="text-blue-600 text-xs font-semibold uppercase tracking-widest">
                  Shopify Storefront API
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Need Workshop Supplies?</h2>
              <p className="text-slate-500 text-sm mt-1">
                Order approved parts, consumables and safety equipment for your Hub location.
              </p>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <Skeleton className="h-40 rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogueProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {catalogueProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.handle}`}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div
                    className={`h-36 bg-gradient-to-br ${productGradient(product.id)} flex items-center justify-center`}
                  >
                    <Boxes className="h-12 w-12 text-white/60" />
                  </div>
                  <div className="p-4">
                    {product.productType && (
                      <Badge variant="secondary" className="text-[10px] mb-2">
                        {product.productType}
                      </Badge>
                    )}
                    <p className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition-colors">
                      {product.title}
                    </p>
                    <p className="text-blue-600 font-bold text-sm mt-1.5">
                      {formatPrice(product.priceRange.minVariantPrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">
              No products found — check your Storefront API connection.
            </p>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/products">
                Browse Supply Catalogue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
