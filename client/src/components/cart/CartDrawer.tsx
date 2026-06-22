import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useCheckout } from '../../hooks/useCheckout';
import { formatPrice } from '../../lib/utils';
import CartItem from './CartItem';
import { Button } from '../ui/button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart } = useCart();
  const { redirectToCheckout, canCheckout } = useCheckout();

  const lines = cart?.lines.edges.map((e) => e.node) ?? [];

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-700" />
            <h2 className="font-semibold text-slate-800">
              Cart{' '}
              {lines.length > 0 && (
                <span className="text-slate-500 font-normal text-sm">({lines.length})</span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-10">
              <ShoppingBag className="h-14 w-14 text-slate-200" />
              <p className="text-slate-500 font-medium">Your cart is empty</p>
              <Button variant="outline" onClick={onClose} asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lines.map((line) => (
                <CartItem key={line.id} item={line} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {cart && lines.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-white">
            <div className="flex justify-between text-sm font-semibold text-slate-800">
              <span>Subtotal</span>
              <span>{formatPrice(cart.cost.subtotalAmount)}</span>
            </div>
            <p className="text-xs text-slate-400">Shipping and GST calculated at checkout</p>

            <Button
              className="w-full"
              size="lg"
              disabled={!canCheckout}
              onClick={() => {
                onClose();
                redirectToCheckout();
              }}
            >
              Checkout
            </Button>

            <Button variant="outline" className="w-full" onClick={onClose} asChild>
              <Link to="/cart">View full cart</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
