'use client';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Recycle, Zap } from 'lucide-react';

const values = [
  {
    icon: ShieldCheck,
    title: 'Premium Quality',
    description: 'We use the finest fabrics and meticulous construction for every single piece.'
  },
  {
    icon: Truck,
    title: 'Global Shipping',
    description: 'Express delivery to your doorstep, no matter where you are in the world.'
  },
  {
    icon: Recycle,
    title: 'Ethical Craft',
    description: 'Sustainability is at our core. We believe in fashion that feels good and does good.'
  },
  {
    icon: Zap,
    title: 'Limited Drops',
    description: 'Exclusive releases that define the culture. Once it is gone, it is gone.'
  }
];

const BrandValues = () => (
  <section className="px-6 py-24 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-black group-hover:text-white transition-all duration-500 border border-gray-100">
              <v.icon className="w-6 h-6 outline-none" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{v.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[240px] uppercase font-medium [word-spacing:0.1em]">{v.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BrandValues;
