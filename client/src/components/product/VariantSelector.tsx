import { useCallback, useEffect, useState } from 'react';
import { ShopifyProductOption, ShopifyProductVariant } from '../../types/shopify';
import { cn } from '../../lib/utils';

interface VariantSelectorProps {
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
  selectedVariant: ShopifyProductVariant | null;
  onVariantChange: (variant: ShopifyProductVariant) => void;
}

export default function VariantSelector({
  options,
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Seed initial selection from first variant
  useEffect(() => {
    if (variants.length === 0) return;
    const first = variants[0];
    const initial = first.selectedOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.name]: opt.value }),
      {} as Record<string, string>
    );
    setSelectedOptions(initial);
  }, [variants]);

  // Find the matching variant whenever selected options change
  const findVariant = useCallback(
    (opts: Record<string, string>) => {
      return variants.find((v) =>
        v.selectedOptions.every((opt) => opts[opt.name] === opt.value)
      );
    },
    [variants]
  );

  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0) return;
    const match = findVariant(selectedOptions);
    if (match) onVariantChange(match);
  }, [selectedOptions, findVariant, onVariantChange]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  // Only show selector if there are real option choices (not just the default "Title" variant)
  const hasRealOptions = options.some((o) => o.values.length > 1 || o.name !== 'Title');
  if (!hasRealOptions) return null;

  return (
    <div className="space-y-5">
      {options.map((option) => {
        if (option.values.length === 1 && option.name === 'Title') return null;
        return (
          <div key={option.id}>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {option.name}:{' '}
              <span className="font-normal text-slate-500">
                {selectedOptions[option.name]}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const testOpts = { ...selectedOptions, [option.name]: value };
                const matchingVariant = findVariant(testOpts);
                const isAvailable = matchingVariant?.availableForSale ?? false;
                const isSelected = selectedOptions[option.name] === value;

                return (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(option.name, value)}
                    disabled={!isAvailable}
                    className={cn(
                      'px-3.5 py-1.5 text-sm border rounded-md transition-all',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : isAvailable
                        ? 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                        : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedVariant && !selectedVariant.availableForSale && (
        <p className="text-sm text-red-600 font-medium">
          This combination is currently out of stock.
        </p>
      )}
    </div>
  );
}
