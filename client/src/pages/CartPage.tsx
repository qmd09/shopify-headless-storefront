import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export default function CartPage() {
  const { cart, loading } = useCart();
  const { redirectToCheckout } = useCheckout();

  const lines = cart?.lines.edges.map((e) => e.node) ?? [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || lines.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center justify-center text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Your cart is empty</h1>
            <p className="text-slate-500 text-sm mt-1">
              Looks like you haven't added anything yet.
            </p>
          </div>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Shopping Cart</h1>
        <span className="text-sm text-slate-500">
          {lines.length} {lines.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line items */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 px-5">
            {lines.map((line) => (
              <CartItem key={line.id} item={line} />
            ))}
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mt-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Summary sidebar */}
        <div>
          <CartSummary
            cart={cart}
            onCheckout={redirectToCheckout}
            checkoutLabel="Proceed to Checkout →"
          />
        </div>
      </div>
    </div>
  );
}
