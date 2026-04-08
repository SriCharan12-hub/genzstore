import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../src/models/Product';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    console.log('📦 Products in Database:');
    
    const products = await Product.find().select('name price stock category').limit(10);
    
    if (products.length === 0) {
      console.log('❌ No products found in database. You need to create some products first!');
    } else {
      console.log(`✅ Found ${products.length} products:\n`);
      products.forEach((p: any) => {
        console.log(`  - ${p.name}`);
        console.log(`    Price: ₹${p.price}, Stock: ${p.stock}, Category: ${p.category}`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

checkProducts();
