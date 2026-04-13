'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut } from 'lucide-react';
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
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || '';
  const totalItems = useCartStore((s) => s.totalItems(userId));
  const wishlistCount = useWishlistStore((s) => s.count(userId));

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
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-white/80 backdrop-blur-xl'} border-b border-gray-100/50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: Hamburger (mobile) + Nav Links (desktop) */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-1.5 -ml-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
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
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <Image
                src="/KK-Brand-NoBG-Black-Mark.png"
                alt="KK Brand Logo"
                width={110}
                height={33}
                className="h-7 sm:h-9 w-auto object-contain"
                priority
              />
            </Link>

            {/* Right: Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <Link
                href="/wishlist"
                className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-[18px] h-[18px]" />
                {isClient && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {isClient && totalItems > 0 && (
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
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-50 rounded-sm">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold truncate">{session.user?.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/account" className="px-4 py-3 text-xs uppercase tracking-wider hover:bg-gray-50 text-left">My Account</Link>
                    <button
                      onClick={() => signOut({ redirect: true, callbackUrl: '/products' })}
                      className="px-4 py-3 text-xs uppercase tracking-wider text-red-500 hover:bg-red-50 text-left border-t border-gray-100 w-full flex items-center gap-2"
                    >
                      <LogOut className="w-3 h-3" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden sm:flex p-1.5 border border-black rounded-full text-[10px] font-bold uppercase tracking-wider ml-1 px-4 hover:bg-black hover:text-white transition-colors"
                >
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
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-3">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
                    <X className="w-4 h-4 text-gray-400 hover:text-black" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed top-0 left-0 bottom-0 z-40 w-72 bg-white pt-16 flex flex-col lg:hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo in drawer */}
              <div className="px-6 pb-4 border-b border-gray-100">
                <Image
                  src="/KK-Brand-NoBG-Black-Mark.png"
                  alt="KK Brand Logo"
                  width={90}
                  height={27}
                  className="h-7 w-auto"
                />
              </div>

              {/* Nav links */}
              <div className="flex flex-col px-4 pt-4 flex-1 overflow-y-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center py-4 px-2 text-base font-bold uppercase tracking-wider text-black hover:text-gray-500 border-b border-gray-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-6 space-y-2">
                  {session ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <button
                        onClick={() => { setMobileOpen(false); signOut({ redirect: true, callbackUrl: '/' }); }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-3 text-center text-sm font-bold uppercase tracking-wider bg-black text-white rounded-lg"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-3 text-center text-sm font-bold uppercase tracking-wider border border-black text-black rounded-lg"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
