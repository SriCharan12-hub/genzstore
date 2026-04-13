'use client';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Image from 'next/image';

const Newsletter = () => (
  <section className="relative py-16 sm:py-24 overflow-hidden bg-black group">
    {/* Background Image */}
    <div className="absolute inset-0 opacity-40 z-0 scale-110 group-hover:scale-100 transition-transform duration-1000">
      <Image
        src="/images/newsletter-bg.png"
        alt="Streetwear Lookbook"
        fill
        className="object-cover grayscale brightness-50"
      />
    </div>

    {/* Content */}
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <span className="inline-block p-2.5 sm:p-3 rounded-full bg-white/10 backdrop-blur-md mb-6 sm:mb-8 border border-white/20">
          <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 sm:mb-6">
          Join the{' '}
          <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Culture</span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-8 sm:mb-10 max-w-md sm:max-w-xl mx-auto uppercase tracking-widest leading-loose">
          Subscribe to get elite access to limited drops, exclusive lookbooks, and member rewards.
        </p>

        <form className="flex flex-col sm:flex-row items-stretch justify-center max-w-md mx-auto shadow-2xl">
          <input
            type="email"
            placeholder="ENTER YOUR EMAIL"
            className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all placeholder:text-gray-500 uppercase tracking-widest sm:border-r-0"
            required
          />
          <button
            type="submit"
            className="bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white border-2 border-white transition-all duration-300 whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-6 text-[10px] text-gray-500 uppercase tracking-widest">
          By signing up, you agree to our{' '}
          <a href="/privacy" className="text-gray-400 hover:text-white border-b border-gray-600 transition-colors">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>

    {/* Decorative blobs */}
    <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 blur-3xl rounded-full pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 blur-3xl rounded-full pointer-events-none" />
  </section>
);

export default Newsletter;
