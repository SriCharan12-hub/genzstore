'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images?: string[];
  category: string;
  ratings?: number;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const id = product._id;
  const name = product.name;
  const price = product.price;
  const comparePrice = product.comparePrice;
  const image = product.thumbnail || product.images?.[0] || '';
  const category = product.category;
  const ratings = product.ratings || 0;
  const stock = product.stock && product.stock > 0 ? product.stock : 0;
  const addItem = useCartStore((s) => s.addItem);
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(id));
  const [quantity, setQuantity] = useState(1);
  const [showQuantityPicker, setShowQuantityPicker] = useState(false);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const isOutOfStock = stock === 0;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`Product: ${name}, Stock: ${stock}`);
  }

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Filter timestamps from last minute
    const recentClicks = clickTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    
    // If more than 10 clicks in the last minute, block
    if (recentClicks.length >= 10) {
      toast.error('Too many add to cart clicks. Please wait a moment.');
      return false;
    }
    
    // Add current click timestamp
    setClickTimestamps([...recentClicks, now]);
    return true;
  };

  const handleAddToCart = () => {
    // Check rate limit first
    if (!checkRateLimit()) {
      return;
    }

    if (isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    
    if (quantity <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }
    
    if (quantity > stock) {
      toast.error(`Only ${stock} available in stock`);
      return;
    }

    addItem({ id, name, price, image, quantity, stock });
    toast.success(`Added ${quantity} x ${name} to cart`);
    setQuantity(1);
    setShowQuantityPicker(false);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const numValue = Math.max(1, Math.min(stock, newQuantity));
    if (numValue >= 1 && numValue <= stock) {
      setQuantity(numValue);
    }
  };

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
          {isOutOfStock && (
            <span className="absolute top-3 left-3 bg-gray-600 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
              Out of Stock
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
        <div className="relative group/tooltip">
          <button
            onClick={() => !isOutOfStock && setShowQuantityPicker(!showQuantityPicker)}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Stock unavailable' : ''}
            className={`p-2.5 rounded-full shadow-lg transition-all ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-black hover:text-white'}`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          {isOutOfStock && (
            <div className="absolute bottom-full right-0 mb-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
              Stock Unavailable
            </div>
          )}
        </div>
      </div>

      {/* Quantity Picker Popup */}
      {showQuantityPicker && !isOutOfStock && (
        <div className="absolute bottom-[calc(25%+1rem)] right-12 bg-white border-2 border-black shadow-lg p-3 rounded-lg z-10 w-40">
          <p className="text-xs font-bold uppercase tracking-wide mb-2">Select Quantity</p>
          <p className="text-xs text-gray-600 mb-3">Stock: {stock} available</p>
          
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min="1"
              max={stock}
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                const clamped = Math.max(1, Math.min(stock, value));
                setQuantity(clamped);
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1;
                if (value > stock) {
                  setQuantity(stock);
                }
              }}
              className="w-12 text-center border border-gray-200 py-1 text-sm font-bold outline-none"
            />
            <button
              onClick={() => handleQuantityChange(Math.min(stock, quantity + 1))}
              disabled={quantity >= stock}
              className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white text-xs font-bold uppercase tracking-wider py-2 hover:bg-gray-900 transition-colors"
          >
            Add to Cart
          </button>
          
          <button
            onClick={() => setShowQuantityPicker(false)}
            className="w-full text-xs text-gray-500 mt-2 hover:text-black transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Out of Stock State */}
      {isOutOfStock && showQuantityPicker && (
        <div className="absolute bottom-[calc(25%+1rem)] right-12 bg-white border-2 border-red-500 shadow-lg p-3 rounded-lg z-10 w-40">
          <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-3">Stock Unavailable</p>
          <button
            onClick={() => setShowQuantityPicker(false)}
            className="w-full text-xs text-gray-500 hover:text-black transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="text-sm font-semibold tracking-tight mb-1 line-clamp-1 hover:underline">{name}</h3>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold">{formatPrice(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(comparePrice)}</span>
          )}
        </div>
        <p className={`text-xs font-medium tracking-wider mb-1.5 ${isOutOfStock ? 'text-red-500' : stock < 5 ? 'text-orange-500' : 'text-green-600'}`}>
          {isOutOfStock ? 'Out of Stock' : stock < 5 ? `Only ${stock} left!` : `${stock} in stock`}
        </p>
        {ratings > 0 && (
          <div className="flex items-center gap-1">
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
