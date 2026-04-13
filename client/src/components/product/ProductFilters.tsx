'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface ProductFiltersProps {
  currentSort?: string;
}

const categories = ['All', 'Hoodies', 'Tees', 'Outerwear', 'Bottoms', 'Accessories', 'Footwear'];
const genders = [
  { value: 'all', label: 'All' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
];

export default function ProductFilters({ currentSort = 'newest' }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category.toLowerCase());
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleGenderClick = (gender: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (gender === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', gender);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const currentGender = searchParams.get('gender') || 'all';
  const currentCategory = searchParams.get('category') || '';

  const activeFilterCount = (currentCategory ? 1 : 0) + (currentGender !== 'all' ? 1 : 0);

  return (
    <div className="mb-8 sm:mb-10">
      {/* Mobile: Filter toggle bar */}
      <div className="flex items-center gap-3 mb-4 sm:hidden">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex-1" />
        <select
          className="text-xs border border-gray-200 px-3 py-2.5 bg-white uppercase tracking-wider outline-none cursor-pointer rounded-sm"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low–High</option>
          <option value="price-desc">Price: High–Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Mobile: Expandable filter panel */}
      {filterOpen && (
        <div className="sm:hidden mb-4 p-4 border border-gray-100 bg-gray-50 rounded-sm space-y-4">
          {/* Gender */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 block mb-2">For</span>
            <div className="flex flex-wrap gap-2">
              {genders.map((g) => {
                const isActive = currentGender === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => { handleGenderClick(g.value); }}
                    className={`text-xs font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-all ${
                      isActive ? 'bg-black text-white border-black' : 'border-gray-200 bg-white hover:border-black'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Category */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 block mb-2">Category</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive =
                  (cat === 'All' && !searchParams.get('category')) ||
                  (cat !== 'All' && searchParams.get('category') === cat.toLowerCase());
                return (
                  <button
                    key={cat}
                    onClick={() => { handleCategoryClick(cat); }}
                    className={`text-xs font-medium uppercase tracking-[0.1em] px-3 py-2 border transition-all ${
                      isActive ? 'bg-black text-white border-black' : 'border-gray-200 bg-white hover:border-black'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Active filters clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-1.5 text-xs text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Desktop: Original inline filters */}
      <div className="hidden sm:block pb-6 border-b border-gray-100 space-y-4">
        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mr-1">For</span>
          {genders.map((g) => {
            const isActive = currentGender === g.value;
            return (
              <button
                key={g.value}
                onClick={() => handleGenderClick(g.value)}
                className={`text-xs font-bold uppercase tracking-[0.1em] px-5 py-2 border transition-all ${
                  isActive ? 'bg-black text-white border-black' : 'border-gray-200 hover:bg-black hover:text-white hover:border-black'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Category + Sort row */}
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((cat) => {
            const isActive =
              (cat === 'All' && !searchParams.get('category')) ||
              (cat !== 'All' && searchParams.get('category') === cat.toLowerCase());
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`text-xs font-medium uppercase tracking-[0.1em] px-4 py-2 border transition-all ${
                  isActive ? 'bg-black text-white border-black' : 'border-gray-200 hover:bg-black hover:text-white hover:border-black'
                }`}
              >
                {cat}
              </button>
            );
          })}
          <div className="ml-auto flex gap-2">
            <select
              className="text-xs border border-gray-200 px-3 py-2 bg-white uppercase tracking-wider outline-none cursor-pointer"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
