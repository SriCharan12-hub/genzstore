'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { name: 'Hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=687&auto=format&fit=crop', href: '/products?category=hoodies' },
  { name: 'Tees', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=687&auto=format&fit=crop', href: '/products?category=tees' },
  { name: 'Outerwear', image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?q=80&w=687&auto=format&fit=crop', href: '/products?category=outerwear' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=687&auto=format&fit=crop', href: '/products?category=accessories' },
];

const FeaturedCategories = () => (
  <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 sm:mb-14">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-2 sm:mb-3">Browse By</span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter">Categories</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={cat.href} className="group relative aspect-[3/4] block overflow-hidden bg-gray-100">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                <h3 className="text-white text-sm sm:text-lg font-bold uppercase tracking-wider">{cat.name}</h3>
                <span className="text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-widest group-hover:text-white transition-colors">
                  Shop Now →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedCategories;
