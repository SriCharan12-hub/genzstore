import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductClient from '@/components/product/ProductClient';
import ProductCard from '@/components/product/ProductCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

async function fetchProduct(id: string) {
  try {
    const url = `${API_URL}/api/products/detail/${id}`;
    const res = await fetch(url, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error(`Product API returned ${res.status} for id: ${id}`);
      return null;
    }
    
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

async function fetchRelatedProducts(category: string, excludeId: string) {
  try {
    const url = `${API_URL}/api/products?category=${category}&limit=4`;
    const res = await fetch(url, {
      cache: 'no-store',
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.data || []).filter((p: any) => p._id !== excludeId).slice(0, 4);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | GenZ Store',
    };
  }

  return {
    title: `${product.name} | GenZ Store`,
    description: product.description || 'Premium streetwear collection',
    keywords: [product.name, product.category, 'streetwear', 'urban fashion'],
    openGraph: {
      title: product.name,
      description: product.description || 'Check out this product',
      type: 'website',
      images: [product.images?.[0] || product.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200'],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.category, id);

  return (
    <div>
      <ProductClient product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
