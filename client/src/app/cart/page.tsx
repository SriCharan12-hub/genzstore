'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
        <button onClick={() => router.back()} className="absolute top-24 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ShoppingCart className="w-16 h-16 text-gray-200 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Your Cart is Empty</h1>
        <p className="text-sm text-gray-500 mb-8">Looks like you havent added anything yet.</p>
        <Link href="/products" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-10">Shopping Cart ({items.length})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-0">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 py-6 border-b border-gray-100">
                <div className="relative w-24 h-32 bg-gray-50 shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-tight">{item.name}</h3>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-50">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-gray-50">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={clearCart} className="text-xs text-gray-400 uppercase tracking-wider mt-4 hover:text-red-500 transition-colors">
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-8 sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(totalPrice())}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{totalPrice() >= 100 ? 'Free' : formatPrice(10)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax (est.)</span><span>{formatPrice(totalPrice() * 0.08)}</span></div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="flex justify-between text-base font-black mb-8">
                <span>Total</span>
                <span>{formatPrice(totalPrice() + (totalPrice() >= 100 ? 0 : 10) + totalPrice() * 0.08)}</span>
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
    </div>
  );
}
