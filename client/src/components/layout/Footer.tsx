import Link from 'next/link';
import { Globe, Send, Sparkles, Mail, ArrowRight } from 'lucide-react';

const footerLinks = {
  shop: [
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=rating' },
    { label: 'Men', href: '/products?category=men' },
    { label: 'Women', href: '/products?category=women' },
    { label: 'Accessories', href: '/products?category=accessories' },
  ],
  help: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Size Guide', href: '/size-guide' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">Stay in the loop</h3>
            <p className="text-sm text-gray-400">Get exclusive access to new drops, sales, and member-only content.</p>
          </div>
          <form className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white/5 border border-white/10 px-5 py-3 text-sm w-full md:w-72 outline-none focus:border-white/30 transition-colors placeholder:text-gray-500"
            />
            <button type="submit" className="bg-white text-black px-5 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2">
              Join <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Links Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Help</h4>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Globe className="w-4 h-4" /></a>
              <a href="#" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Send className="w-4 h-4" /></a>
              <a href="#" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Sparkles className="w-4 h-4" /></a>
              <a href="#" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© 2026 GenZ Store. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>UPI</span>
            <span>Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
