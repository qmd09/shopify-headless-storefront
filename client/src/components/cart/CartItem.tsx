import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { ShopifyCartLine } from '../../types/shopify';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../lib/utils';

interface CartItemProps {
  item: ShopifyCartLine;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);

  const image = item.merchandise.product.images.edges[0]?.node;
  const variantLabel =
    item.merchandise.title !== 'Default Title' ? item.merchandise.title : null;

  const handleQtyChange = async (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    setUpdating(true);
    try {
      await updateQuantity(item.id, newQty);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      await removeFromCart(item.id);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`flex gap-4 py-4 border-b border-slate-100 last:border-0 transition-opacity ${
        updating ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || item.merchandise.product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-200" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {item.merchandise.product.title}
        </p>
        {variantLabel && (
          <p className="text-xs text-slate-500 mt-0.5">{variantLabel}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">
          {formatPrice(item.merchandise.price)} each
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQtyChange(-1)}
            disabled={updating || item.quantity <= 1}
            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => handleQtyChange(1)}
            disabled={updating}
            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Price + Remove */}
      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-slate-800">
          {formatPrice(item.cost.totalAmount)}
        </span>
        <button
          onClick={handleRemove}
          disabled={updating}
          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
