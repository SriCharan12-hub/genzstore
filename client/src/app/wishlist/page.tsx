'use client';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import ProductCard from '@/components/product/ProductCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || '';

  const getItems = useWishlistStore((s) => s.getItems);
  const clear = useWishlistStore((s) => s.clear);

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to view your wishlist');
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const products = getItems(userId);

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
          <button onClick={() => clear(userId)} className="text-xs text-gray-400 uppercase tracking-wider hover:text-red-500 transition-colors">
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
