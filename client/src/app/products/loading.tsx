import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';

export default function Loading() {
  return (
    <div className="pt-20">
      <div className="bg-gray-100 animate-pulse h-40 w-full mb-12" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
