'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Minus, Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import { toast } from 'react-hot-toast';

export default function ProductClient({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || '';
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(product.price);
  const [displayComparePrice, setDisplayComparePrice] = useState(product.comparePrice);
  const stock = product.stock && product.stock > 0 ? product.stock : 0;
  const isOutOfStock = stock === 0;
  const addItem = useCartStore((s) => s.addItem);
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => (userId ? s.has(userId, product._id) : false));

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setQuantity(0);
    if (product.sizePricing && product.sizePricing.length > 0) {
      const sizePrice = product.sizePricing.find((sp: any) => sp.size === size);
      if (sizePrice) {
        setDisplayPrice(sizePrice.price);
        setDisplayComparePrice(sizePrice.comparePrice || product.comparePrice);
        return;
      }
    }
    setDisplayPrice(product.price);
    setDisplayComparePrice(product.comparePrice);
  };

  const getAvailableStock = () => {
    if (selectedSize && product.sizeStock && product.sizeStock.length > 0) {
      const sizeStock = product.sizeStock.find((ss: any) => ss.size === selectedSize);
      if (sizeStock) return sizeStock.quantity;
    }
    return stock;
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentClicks = clickTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    if (recentClicks.length >= 10) {
      setIsRateLimited(true);
      toast.error('Too many add to cart clicks. Please wait a moment.');
      return false;
    }
    setClickTimestamps([...recentClicks, now]);
    if (isRateLimited) setIsRateLimited(false);
    return true;
  };

  const handleAddToCart = () => {
    if (!session) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }
    if (!checkRateLimit()) return;
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    const availableStock = getAvailableStock();
    if (availableStock === 0) {
      toast.error('This size is out of stock');
      return;
    }
    if (quantity <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} available for size ${selectedSize}`);
      return;
    }
    addItem(userId, {
      id: product._id,
      name: product.name,
      price: displayPrice,
      image: product.images?.[0] || product.thumbnail,
      size: selectedSize,
      color: selectedColor,
      quantity,
      stock: product.stock,
    });
    toast.success(`Added ${quantity} x ${product.name} to cart`);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const availableStock = getAvailableStock();
    const clamped = Math.max(1, Math.min(availableStock, newQuantity));
    setQuantity(clamped);
  };

  const availableStock = getAvailableStock();
  const canAddToCart = quantity <= availableStock;

  const handleWishlistToggle = () => {
    if (!session) {
      toast.error('Please login to add to wishlist');
      router.push('/auth/login');
      return;
    }
    wishlistToggle(userId, {
      _id: product._id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      thumbnail: product.thumbnail || product.images?.[0],
      category: product.category,
      ratings: product.ratings,
      stock: product.stock,
    });
    toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <div className="pt-14 sm:pt-20 pb-24 sm:pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors sm:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <Link href="/products" className="hidden sm:inline text-gray-500 hover:text-black text-sm">Products</Link>
          <span className="hidden sm:inline text-gray-400 mx-1">/</span>
          <span className="hidden sm:inline text-sm font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-100 rounded-lg overflow-hidden mb-3 sm:mb-4"
          >
            <Image
              src={
                selectedImage === 0
                  ? product.thumbnail
                  : product.images?.[selectedImage - 1] || product.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'
              }
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
              priority
            />
          </motion.div>

          {/* Thumbnails */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.thumbnail && (
              <button
                onClick={() => setSelectedImage(0)}
                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border-2 transition-all ${
                  selectedImage === 0 ? 'border-black' : 'border-gray-200'
                }`}
              >
                <Image src={product.thumbnail} alt={`${product.name} thumbnail`} width={80} height={80} className="w-full h-full object-cover rounded" />
              </button>
            )}
            {(product.images || []).map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx + 1)}
                className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border-2 transition-all ${
                  selectedImage === idx + 1 ? 'border-black' : 'border-gray-200'
                }`}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} width={80} height={80} className="w-full h-full object-cover rounded" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="pb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 leading-tight">{product.name}</h1>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{product.description}</p>

          {/* Price */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="text-2xl sm:text-3xl font-bold">{formatPrice(displayPrice)}</span>
            {displayComparePrice && displayComparePrice > displayPrice && (
              <span className="text-lg sm:text-xl line-through text-gray-400">{formatPrice(displayComparePrice)}</span>
            )}
          </div>

          {/* Options */}
          <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <label className="text-xs sm:text-sm font-bold uppercase mb-2 sm:mb-3 block">
                  Color: <span className="font-normal text-gray-500 normal-case">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.colors.map((color: any) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all ${
                        selectedColor === color.name ? 'border-black scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div>
                <label className="text-xs sm:text-sm font-bold uppercase mb-2 sm:mb-3 block">Size</label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {product.sizes.map((size: string) => {
                    const sizePrice = product.sizePricing?.find((sp: any) => sp.size === size);
                    const price = sizePrice ? sizePrice.price : product.price;
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`py-2.5 sm:py-3 border-2 font-bold uppercase text-xs tracking-wider transition-all flex flex-col items-center gap-0.5 sm:gap-1 ${
                          selectedSize === size
                            ? 'bg-black text-white border-black'
                            : 'border-gray-200 hover:border-black'
                        }`}
                      >
                        <span>{size}</span>
                        <span className={`text-[9px] sm:text-[10px] font-semibold ${selectedSize === size ? 'text-gray-200' : 'text-gray-500'}`}>
                          {formatPrice(price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-xs sm:text-sm font-bold uppercase mb-2 sm:mb-3 block">Quantity</label>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center border border-gray-200 w-fit">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 sm:px-6 font-bold text-sm sm:text-base">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= availableStock}
                    className="p-2.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className={`text-xs sm:text-sm font-semibold ${availableStock === 0 ? 'text-red-600' : availableStock < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {availableStock === 0
                    ? `${selectedSize ? `Size ${selectedSize}` : 'Product'} out of stock`
                    : availableStock < 5
                    ? `Only ${availableStock} left!`
                    : `${availableStock} in stock`}
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons — hidden on mobile (shown in sticky bar below) */}
          <div className="hidden sm:flex gap-3 sm:gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || !canAddToCart}
              className={`flex-1 py-4 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-sm ${
                isOutOfStock || !canAddToCart
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              <ShoppingCart size={18} />
              {isOutOfStock ? 'Stock Unavailable' : !canAddToCart ? 'Exceeds Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`w-14 border-2 flex items-center justify-center transition-all ${
                isWished ? 'bg-black border-black' : 'border-gray-200 hover:border-black'
              }`}
            >
              <Heart size={18} className={isWished ? 'fill-white text-white' : ''} />
            </button>
          </div>

          {/* Product Info */}
          <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm"><strong>Category:</strong> {product.category}</p>
            <p className="text-xs sm:text-sm"><strong>Brand:</strong> {product.brand || 'KK Brand'}</p>
            <p className="text-xs sm:text-sm"><strong>Stock:</strong> {product.stock ? `${product.stock} available` : 'Check availability'}</p>
          </div>
        </div>
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex gap-3 slide-up"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleWishlistToggle}
          className={`w-12 border-2 flex items-center justify-center rounded-sm transition-all ${
            isWished ? 'bg-black border-black' : 'border-gray-200 hover:border-black'
          }`}
        >
          <Heart size={18} className={isWished ? 'fill-white text-white' : ''} />
        </button>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || !canAddToCart}
          className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs rounded-sm ${
            isOutOfStock || !canAddToCart
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-900'
          }`}
        >
          <ShoppingCart size={16} />
          {isOutOfStock ? 'Out of Stock' : !canAddToCart ? 'Exceeds Stock' : 'Add to Cart'}
        </button>
      </div>

      {/* Reviews Section */}
      {product.reviews?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 pt-10 sm:pt-16 border-t border-gray-200">
          <h2 className="text-xl sm:text-3xl font-black mb-6 sm:mb-8">Customer Reviews</h2>
          <div className="space-y-4 sm:space-y-6">
            {product.reviews.map((review: any) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 sm:pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm sm:text-base">{review.name}</span>
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-black' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-sm sm:text-base">{review.comment}</p>
                <p className="text-xs text-gray-500 mt-1.5">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 pt-10 sm:pt-16 border-t border-gray-200">
          <h2 className="text-xl sm:text-3xl font-black mb-6 sm:mb-8">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {relatedProducts.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
