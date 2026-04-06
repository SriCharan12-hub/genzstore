'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProductClient({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(product._id));

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.thumbnail,
      size: selectedSize,
      color: selectedColor,
      quantity,
      stock: product.stock,
    });
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = () => {
    wishlistToggle(product._id);
    toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <div className="pt-20 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <a href="/products" className="text-sm text-gray-500 hover:text-black">
          Products
        </a>
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
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-xl line-through text-gray-400">{formatPrice(product.comparePrice)}</span>
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
                      onClick={() => setSelectedSize(size)}
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
              <div className="flex items-center border border-gray-200 w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100">
                  <Minus size={18} />
                </button>
                <span className="px-6 font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-100">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white py-4 font-bold uppercase tracking-wider hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} /> Add to Cart
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
