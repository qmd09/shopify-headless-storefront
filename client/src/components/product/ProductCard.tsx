import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { ShopifyProduct } from '../../types/shopify';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ProductCardProps {
  product: ShopifyProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const firstImage = product.images.edges[0]?.node;
  const firstVariant = product.variants.edges[0]?.node;
  const isAvailable = firstVariant?.availableForSale ?? false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || !isAvailable) return;

    setAdding(true);
    try {
      await addToCart(firstVariant.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product.handle}`} className="block group">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="aspect-square bg-slate-100 overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage.url}
              alt={firstImage.altText || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <AlertCircle className="h-10 w-10" />
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col gap-3">
          {/* Type badge */}
          {product.productType && (
            <Badge variant="secondary" className="self-start text-xs">
              {product.productType}
            </Badge>
          )}

          {/* Title */}
          <h3 className="font-medium text-slate-800 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between mt-auto gap-2">
            <span className="text-base font-semibold text-slate-800">
              {formatPrice(product.priceRange.minVariantPrice)}
            </span>

            <Button
              size="sm"
              variant={added ? 'secondary' : isAvailable ? 'default' : 'outline'}
              onClick={handleAddToCart}
              disabled={adding || !isAvailable}
              className="shrink-0"
            >
              {!isAvailable ? (
                'Unavailable'
              ) : adding ? (
                'Adding…'
              ) : added ? (
                '✓ Added'
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
