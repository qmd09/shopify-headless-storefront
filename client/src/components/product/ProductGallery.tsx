import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { ShopifyImage } from '../../types/shopify';
import { cn } from '../../lib/utils';

interface ProductGalleryProps {
  images: ShopifyImage[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mainImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        {mainImage ? (
          <img
            key={mainImage.id}
            src={mainImage.url}
            alt={mainImage.altText || 'Product image'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <ImageIcon className="h-12 w-12" />
            <span className="text-sm">No image available</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                selectedIndex === index
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-400'
              )}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.url}
                alt={image.altText || `Product thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
