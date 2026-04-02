const fs = require('fs');
const path = require('path');

const pages = [
  { p: 'contact', title: 'Contact Us' },
  { p: 'shipping', title: 'Shipping Policy' },
  { p: 'returns', title: 'Returns & Exchanges' },
  { p: 'faq', title: 'FAQ' },
  { p: 'size-guide', title: 'Size Guide' },
  { p: 'about', title: 'About Us' },
  { p: 'careers', title: 'Careers' },
  { p: 'terms', title: 'Terms & Conditions' },
  { p: 'privacy', title: 'Privacy Policy' },
];

const basePath = path.join(__dirname, 'client', 'src', 'app');

pages.forEach(({p, title}) => {
  const dir = path.join(basePath, p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = `import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
  return (
    <div className="pt-32 pb-24 min-h-screen px-6">
      <div className="max-w-3xl mx-auto relative">
        <Link href="/" className="absolute -top-12 left-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-8">${title}</h1>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>This is a placeholder page for ${title}. In a real application, you would populate this with the actual content related to your store operations.</p>
        </div>
      </div>
    </div>
  );
}`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});
console.log('Pages generated successfully.');
