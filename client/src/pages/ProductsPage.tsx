import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useProducts } from '../hooks/useProduct';
import ProductCard from '../components/product/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'title-asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'title-asc', label: 'Title: A → Z' },
];

export default function ProductsPage() {
  const { products, loading } = useProducts(20);
  const [activeType, setActiveType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortKey>('default');

  const productTypes = useMemo(() => {
    const types = products
      .map((p) => p.productType)
      .filter((t): t is string => Boolean(t));
    return ['All', ...Array.from(new Set(types)).sort()];
  }, [products]);

  const displayProducts = useMemo(() => {
    let filtered = products;

    if (activeType !== 'All') {
      filtered = products.filter((p) => p.productType === activeType);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount)
          );
        case 'price-desc':
          return (
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount)
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [products, activeType, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">All Products</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? 'Loading…' : `${displayProducts.length} products`}
          {activeType !== 'All' && ` in ${activeType}`}
        </p>
      </div>

      {/* Filters + Sort bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        {/* Type filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 flex-shrink-0" />
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))
            : productTypes.map((type) => (
                <Button
                  key={type}
                  variant={activeType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveType(type)}
                  className="rounded-full flex-shrink-0 text-xs px-4"
                >
                  {type}
                </Button>
              ))}
        </div>

        {/* Sort select */}
        <div className="flex-shrink-0 w-full sm:w-48">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different filter</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setActiveType('All')}
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  );
}
