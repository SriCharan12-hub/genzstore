import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../src/models/Product';
import { invalidateProductCache } from '../src/config/redis';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    
    console.log('🔄 Clearing product cache from Redis...');
    
    // Invalidate all product cache
    await invalidateProductCache();
    
    console.log('✅ Product cache cleared successfully!');
    console.log('\n📦 Current products in database:');
    
    const products = await Product.find().select('name price stock');
    products.forEach(p => {
      console.log(`  - ${p.name}: Stock = ${p.stock}`);
    });
    
    console.log('\n🎉 Cache and data synchronized!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

clearCache();
