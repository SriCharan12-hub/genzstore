'use client';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import ProductCard from '@/components/product/ProductCard';

// Mock product data lookup — in production, fetch from API by IDs
const productMap: Record<string, { id: string; name: string; slug: string; price: number; image: string; category: string; ratings: number }> = {
  '1': { id: '1', name: 'Cyber Hoodie', slug: 'cyber-hoodie', price: 120, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=687&auto=format&fit=crop', category: 'Hoodies', ratings: 4.5 },
  '2': { id: '2', name: 'Urban Joggers', slug: 'urban-joggers', price: 85, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=687&auto=format&fit=crop', category: 'Bottoms', ratings: 4.2 },
  '3': { id: '3', name: 'Vanguard Jacket', slug: 'vanguard-jacket', price: 250, image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?q=80&w=687&auto=format&fit=crop', category: 'Outerwear', ratings: 4.8 },
  '4': { id: '4', name: 'Matrix Tee', slug: 'matrix-tee', price: 45, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=687&auto=format&fit=crop', category: 'Tees', ratings: 4.0 },
  '5': { id: '5', name: 'Noir Cap', slug: 'noir-cap', price: 35, image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?q=80&w=687&auto=format&fit=crop', category: 'Accessories', ratings: 4.3 },
  '6': { id: '6', name: 'Arc Windbreaker', slug: 'arc-windbreaker', price: 195, image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=687&auto=format&fit=crop', category: 'Outerwear', ratings: 4.6 },
  '7': { id: '7', name: 'Haze Crewneck', slug: 'haze-crewneck', price: 90, image: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=687&auto=format&fit=crop', category: 'Hoodies', ratings: 4.1 },
  '8': { id: '8', name: 'Drift Shorts', slug: 'drift-shorts', price: 55, image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=687&auto=format&fit=crop', category: 'Bottoms', ratings: 3.9 },
};

export default function WishlistPage() {
  const { ids, clear } = useWishlistStore();
  const products = ids.map((id) => productMap[id]).filter(Boolean);

  if (products.length === 0) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <Heart className="w-16 h-16 text-gray-200 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Your Wishlist is Empty</h1>
        <p className="text-sm text-gray-500 mb-8">Save items you love for later.</p>
        <Link href="/products" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tight">Wishlist ({products.length})</h1>
          <button onClick={clear} className="text-xs text-gray-400 uppercase tracking-wider hover:text-red-500 transition-colors">
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
