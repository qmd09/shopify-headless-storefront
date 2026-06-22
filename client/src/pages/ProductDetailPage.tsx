import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useProductByHandle } from '../hooks/useProduct';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/utils';
import { ShopifyProductVariant } from '../types/shopify';
import ProductGallery from '../components/product/ProductGallery';
import VariantSelector from '../components/product/VariantSelector';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export default function ProductDetailPage() {
  const { handle } = useParams<{ handle: string }>();
  const { product, loading, error } = useProductByHandle(handle ?? '');
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const variants = product?.variants.edges.map((e) => e.node) ?? [];
  const images = product?.images.edges.map((e) => e.node) ?? [];

  // Set the first variant as default once product loads
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const handleVariantChange = useCallback((variant: ShopifyProductVariant) => {
    setSelectedVariant(variant);
  }, []);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setAdding(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 text-lg mb-4">Product not found.</p>
        <Button variant="outline" asChild>
          <Link to="/products">← Back to Products</Link>
        </Button>
      </div>
    );
  }

  const isAvailable = selectedVariant?.availableForSale ?? false;
  const displayPrice = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const hasMultiplePrices =
    product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <ProductGallery images={images} />

        {/* Product info */}
        <div className="space-y-6">
          {/* Type + Title */}
          <div className="space-y-2">
            {product.productType && (
              <Badge variant="secondary">{product.productType}</Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Price */}
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {formatPrice(displayPrice)}
            </p>
            {hasMultiplePrices && !selectedVariant && (
              <p className="text-sm text-slate-500 mt-1">
                From {formatPrice(product.priceRange.minVariantPrice)} –{' '}
                {formatPrice(product.priceRange.maxVariantPrice)}
              </p>
            )}
          </div>

          {/* Variant selector */}
          {product.options.length > 0 && (
            <VariantSelector
              options={product.options}
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantChange={handleVariantChange}
            />
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium text-slate-800">{quantity}</span>
              <button
                onClick={() => adjustQuantity(1)}
                className="w-9 h-9 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={adding || !isAvailable}
            variant={added ? 'secondary' : 'default'}
          >
            {!isAvailable ? (
              'Out of Stock'
            ) : adding ? (
              'Adding to Cart…'
            ) : added ? (
              '✓ Added to Cart'
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>

          {/* Description */}
          {product.descriptionHtml ? (
            <div
              className="prose prose-sm prose-slate max-w-none pt-4 border-t border-slate-200 text-slate-600"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="text-slate-600 text-sm leading-relaxed pt-4 border-t border-slate-200">
              {product.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
