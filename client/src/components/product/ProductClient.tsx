'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import { toast } from 'react-hot-toast';

export default function ProductClient({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
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
  const isWished = useWishlistStore((s) => s.has(product._id));

  // Update price when size changes
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    
    // Find size-specific pricing if available
    if (product.sizePricing && product.sizePricing.length > 0) {
      const sizePrice = product.sizePricing.find((sp: any) => sp.size === size);
      if (sizePrice) {
        setDisplayPrice(sizePrice.price);
        setDisplayComparePrice(sizePrice.comparePrice || product.comparePrice);
        return;
      }
    }
    
    // Fallback to base price
    setDisplayPrice(product.price);
    setDisplayComparePrice(product.comparePrice);
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Filter timestamps from last minute
    const recentClicks = clickTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    
    // If more than 10 clicks in the last minute, block
    if (recentClicks.length >= 10) {
      setIsRateLimited(true);
      toast.error('Too many add to cart clicks. Please wait a moment.');
      return false;
    }
    
    // Add current click timestamp
    setClickTimestamps([...recentClicks, now]);
    
    // Reset rate limited flag after some time
    if (isRateLimited) {
      setIsRateLimited(false);
    }
    
    return true;
  };

  const handleAddToCart = () => {
    // Check rate limit first
    if (!checkRateLimit()) {
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size');
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

    addItem({
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
    const clamped = Math.max(1, Math.min(stock, newQuantity));
    setQuantity(clamped);
  };

  const handleWishlistToggle = () => {
    wishlistToggle(product._id);
    toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <div className="pt-20 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/products" className="text-sm text-gray-500 hover:text-black">
          Products
        </Link>
        <span className="text-sm text-gray-400 mx-2">/</span>
        <span className="text-sm font-medium">{product.name}</span>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-100 rounded-lg overflow-hidden mb-4"
          >
            <Image
              src={selectedImage === 0 
                ? product.thumbnail 
                : product.images?.[selectedImage - 1] || product.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
              priority
            />
          </motion.div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Primary Thumbnail */}
            {product.thumbnail && (
              <button
                onClick={() => setSelectedImage(0)}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${
                  selectedImage === 0 ? 'border-black' : 'border-gray-200'
                }`}
                title="Main thumbnail"
              >
                <Image src={product.thumbnail} alt={`${product.name} thumbnail`} width={80} height={80} className="w-full h-full object-cover" />
              </button>
            )}
            
            {/* Additional Images */}
            {(product.images || []).map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx + 1)}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${
                  selectedImage === idx + 1 ? 'border-black' : 'border-gray-200'
                }`}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} width={80} height={80} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-black mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold">{formatPrice(displayPrice)}</span>
            {displayComparePrice && displayComparePrice > displayPrice && (
              <span className="text-xl line-through text-gray-400">{formatPrice(displayComparePrice)}</span>
            )}
          </div>

          {/* Options */}
          <div className="space-y-6 mb-8">
            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <label className="text-sm font-bold uppercase mb-3 block">Color</label>
                <div className="flex gap-3">
                  {product.colors.map((color: any) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
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
                <label className="text-sm font-bold uppercase mb-3 block">Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => handleSizeSelect(size)}
                      className={`py-3 border-2 font-bold uppercase text-xs tracking-wider transition-all ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-bold uppercase mb-3 block">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 w-fit">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-6 font-bold">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className={`text-sm font-semibold ${isOutOfStock ? 'text-red-600' : stock < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : stock < 5 ? `Only ${stock} left!` : `${stock} in stock`}
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || quantity > stock}
              className={`flex-1 py-4 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isOutOfStock || quantity > stock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              <ShoppingCart size={20} /> 
              {isOutOfStock ? 'Stock Unavailable' : quantity > stock ? 'Exceeds Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`w-16 border-2 flex items-center justify-center transition-all ${
                isWished ? 'bg-black border-black' : 'border-gray-200 hover:border-black'
              }`}
            >
              <Heart size={20} className={isWished ? 'fill-white text-white' : ''} />
            </button>
          </div>

          {/* Product Info */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <p className="text-sm"><strong>Category:</strong> {product.category}</p>
            <p className="text-sm"><strong>Brand:</strong> {product.brand || 'GenZ Store'}</p>
            <p className="text-sm"><strong>Stock:</strong> {product.stock ? `${product.stock} available` : 'Check availability'}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews?.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-3xl font-black mb-8">Customer Reviews</h2>
          <div className="space-y-6">
            {product.reviews.map((review: any) => (
              <div key={review._id} className="border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{review.name}</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? 'fill-black' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-3xl font-black mb-8">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
