import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Shield, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import CartDrawer from '../cart/CartDrawer';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/book-service', label: 'Book a Service', end: false },
  { to: '/products', label: 'Supply Store', end: false },
  { to: '/api-explorer', label: 'API Explorer', end: false },
  { to: '/admin/tickets', label: 'Admin', end: false },
];

export default function Header() {
  const { cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 text-slate-900 hover:text-blue-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">IAG Hub Services</p>
                <p className="text-[10px] text-slate-400 leading-tight">NZ Division</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative',
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Track booking — hidden on small screens */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex text-xs px-3 h-8"
                asChild
              >
                <Link to="/admin/tickets">Track Booking</Link>
              </Button>

              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label={`Open cart — ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <Link
                  to="/admin/tickets"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Track Booking
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
