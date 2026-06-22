import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products', end: false },
  { to: '/book-service', label: 'Book a Service', end: false },
  { to: '/api-explorer', label: 'API Explorer', end: false },
  { to: '/admin/tickets', label: 'Admin Tickets', end: false },
];

export default function Nav() {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
