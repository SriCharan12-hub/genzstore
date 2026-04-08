'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';

interface SizePricing {
  size: string;
  price: number;
  comparePrice?: number;
}

interface SizePricingManagerProps {
  productId: string;
  productName: string;
  sizes: string[];
  basePrice: number;
  sizepricing?: SizePricing[];
  onClose: () => void;
  onSave: (sizePricing: SizePricing[]) => Promise<void>;
  accessToken: string;
}

export default function SizePricingManager({
  productId,
  productName,
  sizes,
  basePrice,
  sizepricing = [],
  onClose,
  onSave,
  accessToken,
}: SizePricingManagerProps) {
  const [pricings, setPricings] = useState<SizePricing[]>(sizepricing && sizepricing.length > 0 ? sizepricing : []);
  const [saving, setSaving] = useState(false);

  // Initialize with existing pricing or empty
  useEffect(() => {
    if (sizepricing && sizepricing.length > 0) {
      setPricings(sizepricing);
    } else {
      // Auto-populate with sizes but no prices initially
      setPricings(sizes.map(size => ({ size, price: basePrice })));
    }
  }, [sizepricing, sizes, basePrice]);

  const handlePriceChange = (index: number, field: 'price' | 'comparePrice', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricings(prev => {
      const updated = [...prev];
      if (field === 'price') {
        updated[index] = { ...updated[index], price: numValue };
      } else {
        updated[index] = { ...updated[index], comparePrice: numValue };
      }
      return updated;
    });
  };

  const handleRemoveSize = (index: number) => {
    setPricings(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewSize = () => {
    if (pricings.length < sizes.length) {
      const availableSize = sizes.find(s => !pricings.find(p => p.size === s));
      if (availableSize) {
        setPricings(prev => [...prev, { size: availableSize, price: basePrice }]);
      }
    }
  };

  const handleSave = async () => {
    if (pricings.length === 0) {
      toast.error('Please add at least one size pricing');
      return;
    }

    setSaving(true);
    try {
      await onSave(pricings);
      toast.success('✅ Size pricing updated successfully!');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Size-Based Pricing</h3>
            <p className="text-sm text-gray-500 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to set pricing by size:</h4>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Set a price for each size (higher sizes usually cost more)</li>
              <li>Optional: Add a compare price (original price before discount)</li>
              <li>Leave compare price empty to use product default</li>
              <li>Click Save to apply to your product</li>
            </ul>
          </div>

          {/* Pricing Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Size</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Compare Price</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Discount %</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {pricings.map((pricing, index) => {
                  const discount = pricing.comparePrice
                    ? Math.round(((pricing.comparePrice - pricing.price) / pricing.comparePrice) * 100)
                    : 0;

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{pricing.size}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pricing.price}
                          onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-black"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pricing.comparePrice || ''}
                          onChange={(e) => handlePriceChange(index, 'comparePrice', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-black"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {discount > 0 ? (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            {discount}% off
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveSize(index)}
                          className="text-red-500 hover:text-red-700 inline-flex"
                          title="Remove this size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add New Size Button */}
          {pricings.length < sizes.length && (
            <button
              onClick={handleAddNewSize}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Another Size
            </button>
          )}

          {/* Quick Template Suggestions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">💡 Pricing Templates</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const basePrices = sizes.map((size, idx) => ({
                    size,
                    price: basePrice + (idx * 5),
                    comparePrice: basePrice + (idx * 5) + 20,
                  }));
                  setPricings(basePrices);
                }}
                className="text-xs py-2 px-3 bg-white border border-gray-200 hover:border-gray-400 rounded text-left"
              >
                <div className="font-semibold">Incremental</div>
                <div className="text-gray-500">+$5 per size</div>
              </button>
              <button
                onClick={() => {
                  const largePrices = sizes.map(size => ({
                    size,
                    price: size === 'M' || size === 'L' ? basePrice : basePrice + 10,
                    comparePrice: (size === 'M' || size === 'L' ? basePrice : basePrice + 10) + 20,
                  }));
                  setPricings(largePrices);
                }}
                className="text-xs py-2 px-3 bg-white border border-gray-200 hover:border-gray-400 rounded text-left"
              >
                <div className="font-semibold">Premium Large</div>
                <div className="text-gray-500">Larger sizes +$10</div>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Pricing'}
          </button>
        </div>
      </div>
    </div>
  );
}
