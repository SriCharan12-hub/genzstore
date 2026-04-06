'use client';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Image from 'next/image';

const Newsletter = () => (
  <section className="relative py-24 overflow-hidden bg-black group">
    {/* Background Image with Parallax-like effect */}
    <div className="absolute inset-0 opacity-40 z-0 scale-110 group-hover:scale-100 transition-transform duration-1000">
      <Image
        src="/images/newsletter-bg.png"
        alt="Streetwear Lookbook"
        fill
        className="object-cover grayscale brightness-50"
      />
    </div>

    {/* Content */}
    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <span className="inline-block p-3 rounded-full bg-white/10 backdrop-blur-md mb-8 border border-white/20">
          <Mail className="w-6 h-6 text-white" />
        </span>
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
          Join the <span className="text-transparent text-stroke-1 text-stroke-white">Culture</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base mb-10 max-w-xl mx-auto uppercase tracking-widest leading-loose">
          Subscribe to get elite access to limited drops, exclusive lookbooks, and genz club rewards. 
        </p>

        <form className="flex flex-col md:flex-row items-center justify-center gap-0 max-w-md mx-auto group/form shadow-2xl">
          <input
            type="email"
            placeholder="ENTER YOUR EMAIL"
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all placeholder:text-gray-500 uppercase tracking-widest"
            required
          />
          <button
            type="submit"
            className="w-full md:w-auto bg-white text-black px-10 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white border-2 border-white transition-all duration-300"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest">
          By signing up, you agree to our <a href="#" className="text-gray-400 hover:text-white border-b border-gray-600">Privacy Policy</a>
        </p>
      </motion.div>
    </div>

    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-3xl rounded-full" />
  </section>
);

export default Newsletter;
