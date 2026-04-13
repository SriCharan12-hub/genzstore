'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || '';

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
  const isWished = useWishlistStore((s) => (userId ? s.has(userId, id) : false));

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [quantity, setQuantity] = useState(1);
  const [showQuantityPicker, setShowQuantityPicker] = useState(false);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const isOutOfStock = stock === 0;

  const requireLogin = (): boolean => {
    if (!session) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return true;
    }
    return false;
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentClicks = clickTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    if (recentClicks.length >= 10) {
      toast.error('Too many add to cart clicks. Please wait a moment.');
      return false;
    }
    setClickTimestamps([...recentClicks, now]);
    return true;
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (requireLogin()) return;
    wishlistToggle(userId, {
      _id: id,
      name,
      price,
      comparePrice,
      thumbnail: image,
      category,
      ratings,
      stock,
    });
    const nowWished = isWished;
    toast.success(nowWished ? `Removed from wishlist` : `Added to wishlist`);
  };

  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (requireLogin()) return;
    if (!isOutOfStock) setShowQuantityPicker(!showQuantityPicker);
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (requireLogin()) return;
    if (!checkRateLimit()) return;

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

    addItem(userId, { id, name, price, image, quantity, stock });
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
        <div className="aspect-[3/4] relative w-full bg-gray-50 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {comparePrice && comparePrice > price && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase tracking-wider">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute top-2 left-2 bg-gray-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase tracking-wider">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      {/* Action buttons — always visible on mobile, hover on desktop */}
      <div className="absolute bottom-[calc(25%+0.5rem)] right-2 flex flex-col gap-1.5 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:transition-all sm:duration-300">
        <button
          onClick={handleWishlistToggle}
          aria-label={isClient && isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`p-2 sm:p-2.5 rounded-full shadow-md transition-all ${isClient && isWished ? 'bg-red-500 text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white'}`}
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isClient && isWished ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleCartButtonClick}
          disabled={isOutOfStock}
          aria-label="Add to cart"
          className={`p-2 sm:p-2.5 rounded-full shadow-md transition-all ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/90 text-black hover:bg-black hover:text-white'}`}
        >
          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Quantity Picker Popup */}
      {showQuantityPicker && !isOutOfStock && (
        <div className="absolute bottom-[calc(25%+0.5rem)] right-10 bg-white border-2 border-black shadow-xl p-3 rounded-lg z-20 w-36 sm:w-40">
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1">Qty</p>
          <p className="text-[9px] text-gray-500 mb-2">Stock: {stock}</p>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={(e) => { e.preventDefault(); handleQuantityChange(Math.max(1, quantity - 1)); }}
              disabled={quantity <= 1}
              className="p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-bold px-2">{quantity}</span>
            <button
              onClick={(e) => { e.preventDefault(); handleQuantityChange(Math.min(stock, quantity + 1)); }}
              disabled={quantity >= stock}
              className="p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-wider py-2 hover:bg-gray-900 transition-colors rounded-sm"
          >
            Add to Cart
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setShowQuantityPicker(false); }}
            className="w-full text-[10px] text-gray-400 mt-1.5 hover:text-black transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 sm:p-4">
        <Link href={`/products/${id}`}>
          <h3 className="text-xs sm:text-sm font-semibold tracking-tight mb-1 line-clamp-2 hover:underline leading-tight">{name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
          <span className="text-xs sm:text-sm font-bold">{formatPrice(price)}</span>
          {comparePrice && comparePrice > price && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through">{formatPrice(comparePrice)}</span>
          )}
        </div>
        <p className={`text-[9px] sm:text-xs font-medium tracking-wide mb-1 ${isOutOfStock ? 'text-red-500' : stock < 5 ? 'text-orange-500' : 'text-green-600'}`}>
          {isOutOfStock ? 'Out of Stock' : stock < 5 ? `Only ${stock} left!` : `In stock`}
        </p>
        {ratings > 0 && (
          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-[9px] sm:text-[10px] ${i < Math.round(ratings) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
            ))}
            <span className="text-[9px] sm:text-[10px] text-gray-400 ml-0.5">{ratings.toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
