import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Truck, Shield, ShieldCheck, Wrench, Star, Clock } from 'lucide-react';
import { useProducts } from '../hooks/useProduct';
import ProductCard from '../components/product/ProductCard';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

const VALUE_PROPS = [
  {
    icon: Package,
    title: 'Curated Supply Catalogue',
    description: 'Sourced and approved for IAG workplace procurement.',
  },
  {
    icon: Truck,
    title: 'Fast Internal Fulfilment',
    description: 'Orders dispatched from the Auckland Hub within 48 hours.',
  },
  {
    icon: Shield,
    title: 'ServiceNow Integration',
    description: 'Every order auto-generates a support ticket for tracking.',
  },
];

const SERVICES = [
  {
    type: 'wof',
    icon: ShieldCheck,
    title: 'Warrant of Fitness (WoF)',
    price: 99,
    description: 'Certified WoF inspection at your nearest AMI MotorHub.',
    duration: '~45 mins',
  },
  {
    type: 'standard',
    icon: Wrench,
    title: 'Standard Vehicle Service',
    price: 199,
    description: 'Oil change, filter replacement, fluid top-ups and full inspection.',
    duration: '~2 hours',
  },
  {
    type: 'premium',
    icon: Star,
    title: 'Premium Vehicle Service',
    price: 349,
    description: 'Comprehensive service including brake inspection, tyre rotation and full diagnostics.',
    duration: '~3.5 hours',
  },
];

export default function HomePage() {
  const { products, loading } = useProducts(6);
  const navigate = useNavigate();

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">
              IAG New Zealand — Internal Procurement
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              IAG Hub Services
              <br />
              Supply Store
            </h1>
            <p className="mt-5 text-lg text-blue-100 leading-relaxed">
              Your workplace supply partner — order approved equipment, stationery and
              peripherals. Every order is tracked through ServiceNow automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {/* Primary CTA — white bg, blue text (readable on dark hero) */}
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 border-0"
                asChild
              >
                <Link to="/products">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {/* Secondary CTA — outline variant: white bg, blue-600 text, blue-600 border */}
              <Button size="lg" variant="outline" asChild>
                <Link to="/admin/tickets">View Tickets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value props ───────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-4 items-start py-6 md:py-0 md:px-8 first:pt-0 last:pb-0 md:first:pl-0 md:last:pr-0"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Featured Products</h2>
            <p className="text-slate-500 text-sm mt-1">Frequently ordered by IAG teams</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <p className="text-center text-slate-500 py-16">
            No products found. Check your Storefront API connection.
          </p>
        )}
      </section>

      {/* ── Hub Service Booking ───────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                AMI MotorHub
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Book a Hub Service</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-lg">
              Book your vehicle service online — every booking automatically creates a
              ServiceNow job card for our workshop team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ type, icon: Icon, title, price, description, duration }) => (
              <div
                key={type}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col gap-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xl font-bold text-slate-800">${price}</span>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{duration}</span>
                </div>

                <Button
                  className="w-full mt-auto"
                  onClick={() => navigate(`/book-service?type=${type}`)}
                >
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────── */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl font-bold mb-3">Need something not in the catalogue?</h2>
          <p className="text-slate-300 mb-6 max-w-lg mx-auto">
            Raise a ServiceNow ticket directly and our Hub team will source it for you.
          </p>
          {/* outline variant: white bg + blue-600 text + blue-600 border — legible on dark bg */}
          <Button size="lg" variant="outline" asChild>
            <Link to="/admin/tickets">View Support Tickets</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
