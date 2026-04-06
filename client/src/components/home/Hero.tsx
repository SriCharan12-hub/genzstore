'use client';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Background Video */}
      <div className="absolute inset-0 opacity-30 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=1932&auto=format&fit=crop"
        >
          <source src="https://assets.mixkit.co/videos/1222/1222-720.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent z-1" />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent z-1" />
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs md:text-sm font-medium uppercase tracking-[0.4em] text-gray-300 mb-6"
        >
          Spring / Summer 2026 Collection
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl sm:text-8xl md:text-[10rem] font-black uppercase tracking-[-0.05em] mb-8 leading-[0.85] italic"
        >
          Redefine <br />
          <span className="text-transparent font-outline-2">Your Style</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm md:text-base font-light mb-12 tracking-wider text-gray-300 max-w-lg mx-auto"
        >
          Premium streetwear crafted for the digital generation. Ethically made, limitlessly styled.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <a
            href="/products"
            className="group relative px-12 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.25em] overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10">Shop Collection</span>
            <div className="absolute inset-0 bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">Shop Collection</span>
          </a>
          <a
            href="/products?category=new"
            className="px-12 py-5 border border-white/20 text-xs font-black uppercase tracking-[0.25em] text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
          >
            New Arrivals
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
