import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
  return (
    <div className="pt-32 pb-24 min-h-screen px-6">
      <div className="max-w-3xl mx-auto relative">
        <Link href="/" className="absolute -top-12 left-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-8">Careers</h1>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>This is a placeholder page for Careers. In a real application, you would populate this with the actual content related to your store operations.</p>
        </div>
      </div>
    </div>
  );
}