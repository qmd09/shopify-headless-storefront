import { ShopifyCart } from '../../types/shopify';
import { formatPrice } from '../../lib/utils';
import { Button } from '../ui/button';

interface CartSummaryProps {
  cart: ShopifyCart;
  onCheckout: () => void;
  checkoutLabel?: string;
}

export default function CartSummary({
  cart,
  onCheckout,
  checkoutLabel = 'Proceed to Checkout',
}: CartSummaryProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
      <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
        Order Summary
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal ({cart.totalQuantity} items)</span>
          <span>{formatPrice(cart.cost.subtotalAmount)}</span>
        </div>

        {cart.cost.totalTaxAmount && (
          <div className="flex justify-between text-slate-600">
            <span>GST</span>
            <span>{formatPrice(cart.cost.totalTaxAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Shipping</span>
          <span className="text-green-700 font-medium">Calculated at checkout</span>
        </div>

        <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-800 text-base">
          <span>Total</span>
          <span>{formatPrice(cart.cost.totalAmount)}</span>
        </div>
      </div>

      <Button className="w-full" onClick={onCheckout} size="lg">
        {checkoutLabel}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        You'll be redirected to Shopify's secure checkout
      </p>
    </div>
  );
}
