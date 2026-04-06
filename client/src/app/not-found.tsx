import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
      <AlertCircle className="w-16 h-16 text-gray-300 mb-6" />
      <h1 className="text-4xl font-black uppercase tracking-tight mb-3">404</h1>
      <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="px-8 py-3 border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          Shop Products
        </Link>
      </div>
    </div>
  );
}
