import Link from 'next/link';
import Image from 'next/image';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 sm:mb-2">Stay in the loop</h3>
            <p className="text-sm text-gray-400">Get exclusive access to new drops, sales, and member-only content.</p>
          </div>
          <form className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white/5 border border-white/10 px-4 sm:px-5 py-3 text-sm w-full md:w-64 outline-none focus:border-white/30 transition-colors placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="bg-white text-black px-4 sm:px-5 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Join <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 sm:mb-6">Shop</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 sm:mb-6">Help</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 sm:mb-6">Company</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 sm:mb-6">Follow Us</h4>
            <div className="flex gap-3 flex-wrap">
              <a href="#" aria-label="Website" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Globe className="w-4 h-4" /></a>
              <a href="#" aria-label="Telegram" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Send className="w-4 h-4" /></a>
              <a href="#" aria-label="Instagram" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Sparkles className="w-4 h-4" /></a>
              <a href="#" aria-label="Email" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/KK-Brand-NoBg-White-Mark.png"
              alt="KK Brand Logo"
              width={80}
              height={24}
              className="h-5 sm:h-6 w-auto object-contain opacity-70"
            />
            <p className="text-xs text-gray-500">© 2026 All rights reserved.</p>
          </div>
          <div className="flex gap-4 sm:gap-6 text-xs text-gray-500">
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
