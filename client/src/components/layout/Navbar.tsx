'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useSession, signOut } from 'next-auth/react';

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/products?category=men', label: 'Men' },
  { href: '/products?category=women', label: 'Women' },
  { href: '/products?category=accessories', label: 'Accessories' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const { data: session } = useSession();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Menu + Nav Links */}
            <div className="flex items-center gap-8">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-medium uppercase tracking-[0.15em] text-gray-600 hover:text-black transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-[-0.04em] uppercase">
              Gen<span className="text-white bg-black px-1.5 py-0.5 ml-0.5">Z</span>
            </Link>

            {/* Right: Icons */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-[18px] h-[18px]" />
              </button>
              <Link href="/wishlist" className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <Heart className="w-[18px] h-[18px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="w-[18px] h-[18px]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
              {session ? (
                <div className="relative group p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <span className="flex items-center gap-1 cursor-pointer">
                    <User className="w-[18px] h-[18px]" />
                  </span>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold truncate">{session.user?.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/account" className="px-4 py-3 text-xs uppercase tracking-wider hover:bg-gray-50 text-left">My Account</Link>
                    <button onClick={() => signOut({ redirect: true, callbackUrl: '/products' })} className="px-4 py-3 text-xs uppercase tracking-wider text-red-500 hover:bg-red-50 text-left border-t border-gray-100 w-full">Sign Out</button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="p-1.5 border border-black rounded-full text-[10px] font-bold uppercase tracking-wider ml-1 px-4 hover:bg-black hover:text-white transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-6 py-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                  <button type="button" onClick={() => setSearchOpen(false)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-black" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-8 lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-bold uppercase tracking-tight text-black hover:text-gray-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-4 border-gray-200" />
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium uppercase tracking-widest text-gray-600">
                Sign In
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="text-sm font-medium uppercase tracking-widest text-gray-600">
                Create Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
