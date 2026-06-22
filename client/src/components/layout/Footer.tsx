import { Link } from 'react-router-dom';
import { Shield, MapPin } from 'lucide-react';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/book-service', label: 'Book Service' },
  { to: '/products', label: 'Supply Store' },
  { to: '/admin/tickets', label: 'Admin Tickets' },
  { to: '/api-explorer', label: 'API Explorer' },
];

const HUB_LOCATIONS = [
  { city: 'Auckland', suburb: 'Hobsonville' },
  { city: 'Auckland', suburb: 'East Tamaki' },
  { city: 'Wellington', suburb: 'Ngauranga' },
  { city: 'Christchurch', suburb: 'Moorhouse Ave' },
];

const TECH_STACK = [
  'Shopify Storefront API',
  'React',
  'ServiceNow',
  'Node.js',
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">IAG Hub Services</p>
                <p className="text-slate-500 text-[10px] leading-tight">NZ Division</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Making your world a safer place — one service at a time.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations + Stack */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
                Hub Locations
              </h3>
              <ul className="space-y-2">
                {HUB_LOCATIONS.map(({ city, suburb }) => (
                  <li key={`${city}-${suburb}`} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                    {city} — {suburb}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
                Built with
              </h3>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-700 text-slate-400 bg-slate-800/60"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-500 text-center leading-relaxed">
          © {new Date().getFullYear()} IAG Hub Services — Portfolio project by Tony Dinh demonstrating
          Shopify eCommerce Engineer skills for IAG NZ Hub Services role.
        </div>
      </div>
    </footer>
  );
}
