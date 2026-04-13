'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || '';

  const getItems = useCartStore((s) => s.getItems);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to view your cart');
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="pt-14 sm:pt-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const items = getItems(userId);

  if (items.length === 0) {
    return (
      <div className="pt-14 sm:pt-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <ShoppingCart className="w-14 h-14 sm:w-16 sm:h-16 text-gray-200 mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2 sm:mb-3">Your Cart is Empty</h1>
        <p className="text-sm text-gray-500 mb-6 sm:mb-8">Looks like you haven't added anything yet.</p>
        <Link href="/products" className="px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = totalPrice(userId);
  const shippingCost = subtotal >= 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + shippingCost + tax;

  return (
    <div className="pt-14 sm:pt-20 pb-32 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors mb-4 sm:mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-6 sm:mb-10">
          Cart <span className="text-gray-400">({items.length})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-0">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3 sm:gap-5 py-4 sm:py-6 border-b border-gray-100">
                {/* Image */}
                <div className="relative w-20 h-28 sm:w-24 sm:h-32 bg-gray-50 shrink-0 rounded">
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight line-clamp-2 leading-snug">{item.name}</h3>
                      <div className="flex gap-2 mt-1 text-[10px] sm:text-xs text-gray-400">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>· {item.color}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <div className="flex items-center border border-gray-200 rounded-sm">
                      <button
                        onClick={() => updateQuantity(userId, item.id, item.quantity - 1, item.size, item.color)}
                        className="px-2.5 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-2 text-xs font-bold border-x border-gray-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(userId, item.id, item.quantity + 1, item.size, item.color)}
                        className="px-2.5 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(userId, item.id, item.size, item.color)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => clearCart(userId)}
              className="text-xs text-gray-400 uppercase tracking-wider mt-4 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary — desktop: sticky sidebar, mobile: below items */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-5 sm:p-8 lg:sticky lg:top-24 rounded-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5 sm:mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-5 sm:mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (est.)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="flex justify-between text-base font-black mb-6 sm:mb-8">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-black text-white text-xs font-bold uppercase tracking-[0.15em] py-4 hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/products" className="block text-center text-xs text-gray-400 mt-4 uppercase tracking-wider hover:text-black transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex items-center gap-4"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-base font-black">{formatPrice(grandTotal)}</p>
        </div>
        <Link
          href="/checkout"
          className="bg-black text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 hover:bg-gray-900 transition-colors flex items-center gap-2"
        >
          Checkout <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
