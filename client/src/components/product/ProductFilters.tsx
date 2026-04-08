'use client';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductFiltersProps {
  currentSort?: string;
}

const categories = ['All', 'Hoodies', 'Tees', 'Outerwear', 'Bottoms', 'Accessories', 'Footwear'];

export default function ProductFilters({ currentSort = 'newest' }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category.toLowerCase());
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-gray-100">
      {categories.map((cat) => {
        const isActive = 
          (cat === 'All' && !searchParams.get('category')) ||
          (cat !== 'All' && searchParams.get('category') === cat.toLowerCase());
        
        return (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`text-xs font-medium uppercase tracking-[0.1em] px-4 py-2 border transition-all ${
              isActive
                ? 'bg-black text-white border-black'
                : 'border-gray-200 hover:bg-black hover:text-white hover:border-black'
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
  );
}
