import type { Metadata } from 'next';
import Hero from "@/components/home/Hero";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import BrandValues from "@/components/home/BrandValues";
import Newsletter from "@/components/home/Newsletter";
import ProductCard from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: 'GenZ Store - Premium Streetwear & Fashion',
  description: 'Discover premium streetwear, hoodies, jackets, and accessories at GenZ Store. High-quality urban fashion with free shipping. Shop now!',
  keywords: ['streetwear', 'fashion', 'hoodies', 'urban style', 'premium clothing', 'genZ'],
  openGraph: {
    title: 'GenZ Store - Premium Streetwear',
    description: 'Shop premium streetwear and urban fashion',
    type: 'website',
    siteName: 'GenZ Store',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200'],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

async function fetchFeaturedProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products?limit=8`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 300 } // ISR - revalidate every 5 minutes in prod, no cache in dev
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await fetchFeaturedProducts();
  
  return (
    <div className="bg-white">
      <Hero />
      
      <FeaturedCategories />

      {/* Featured Products */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2 block italic">Newest Releases</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                Latest <span className="text-transparent font-outline-1">Drop</span>
              </h2>
            </div>
            <a href="/products" className="text-xs font-bold uppercase tracking-[0.2em] bg-black text-white px-8 py-4 hover:bg-gray-800 transition-all mt-6 md:mt-0 shadow-lg">
              View All
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Inventory loading...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <BrandValues />
      
      <Newsletter />
    </div>
  );
}
