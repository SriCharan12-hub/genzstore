'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: any;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const id = product._id;
  const name = product.name;
  const slug = product.slug;
  const price = product.price;
  const comparePrice = product.comparePrice;
  const image = product.thumbnail || product.images?.[0] || '';
  const category = product.category;
  const ratings = product.ratings || 0;
  const stock = product.stock || 10;
  const addItem = useCartStore((s) => s.addItem);
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative bg-white"
    >
      <Link href={`/products/${id}`}>
        <div className="aspect-3/4 relative w-full bg-gray-50 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {comparePrice && comparePrice > price && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
              Sale
            </span>
          )}
          <span className="absolute top-3 right-3 bg-black/80 text-white text-[10px] font-medium px-2.5 py-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            {category}
          </span>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="absolute bottom-[calc(25%+1rem)] right-3 flex flex-col gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={() => wishlistToggle(id)}
          className={`p-2.5 rounded-full shadow-lg transition-all ${isWished ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
        >
          <Heart className="w-4 h-4" fill={isWished ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => addItem({ id, name, price, image, quantity: 1, stock })}
          className="bg-white p-2.5 rounded-full shadow-lg hover:bg-black hover:text-white transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="text-sm font-semibold tracking-tight mb-1 line-clamp-1 hover:underline">{name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{formatPrice(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(comparePrice)}</span>
          )}
        </div>
        {ratings > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-[10px] ${i < Math.round(ratings) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
            ))}
            <span className="text-[10px] text-gray-400 ml-1">{ratings.toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
