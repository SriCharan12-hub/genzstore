import type { Metadata } from 'next';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';

export const metadata: Metadata = {
  title: 'Shop All Products | GenZ Store - Premium Streetwear',
  description: 'Browse our premium streetwear collection. High-quality hoodies, jackets, and accessories. Filter by category, size, and price. Free shipping on orders over $50.',
  keywords: ['streetwear', 'hoodies', 'jackets', 'urban fashion', 'clothing'],
  openGraph: {
    title: 'Shop All Products | GenZ Store',
    description: 'Premium streetwear collection',
    type: 'website',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200'],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

async function fetchProducts(searchParams: Record<string, string | undefined>) {
  try {
    const url = new URL(`${API_URL}/api/products`);
    if (searchParams.category) {
      // Capitalize first letter of category for consistency with database
      const category = searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1);
      url.searchParams.append('category', category);
    }
    if (searchParams.search) url.searchParams.append('search', searchParams.search);
    if (searchParams.sort) url.searchParams.append('sort', searchParams.sort);
    if (searchParams.page) url.searchParams.append('page', searchParams.page);
    if (searchParams.minPrice) url.searchParams.append('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) url.searchParams.append('maxPrice', searchParams.maxPrice);

    console.log('Fetching products from:', url.toString());
    // Revalidate every 30 seconds for faster stock updates
    const res = await fetch(url.toString(), { 
      next: { revalidate: 30 },
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!res.ok) {
      console.error('Failed to fetch products. Status:', res.status);
      throw new Error(`Failed to fetch products: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Products fetched:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const products = await fetchProducts(params);
  const currentSort = params.sort || 'newest';

  return (
    <div className="pt-20">
      {/* Header */}
      <div className="bg-black text-white px-6 py-16 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 block mb-3">Premium Collection</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Shop All</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <ProductFilters currentSort={currentSort} />

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          )}
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-center mt-16 gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`w-10 h-10 text-xs font-bold border ${p === 1 ? 'bg-black text-white border-black' : 'border-gray-200 hover:bg-gray-50'} transition-all`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
