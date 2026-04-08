import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../src/models/Product';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PRODUCTS = [
  {
    name: 'Cyber Hoodie',
    slug: 'cyber-hoodie',
    description: 'Premium comfort hoodie with modern design',
    price: 1200,
    comparePrice: 1500,
    category: 'Hoodies',
    brand: 'GenZ',
    thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
    images: [],
    stock: 20,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }],
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Urban Joggers',
    slug: 'urban-joggers',
    description: 'Comfortable urban style joggers',
    price: 850,
    comparePrice: 1200,
    category: 'Bottoms',
    brand: 'GenZ',
    thumbnail: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500',
    images: [],
    stock: 15,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Navy', hex: '#001F3F' }],
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Vanguard Jacket',
    slug: 'vanguard-jacket',
    description: 'Premium vanguard style jacket',
    price: 2500,
    comparePrice: 3500,
    category: 'Outerwear',
    brand: 'GenZ',
    thumbnail: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=500',
    images: [],
    stock: 8,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black', hex: '#000000' }],
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Matrix Tee',
    slug: 'matrix-tee',
    description: 'Matrix inspired graphic tee',
    price: 450,
    comparePrice: 599,
    category: 'Tees',
    brand: 'GenZ',
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: [],
    stock: 50,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#000000' }],
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Noir Cap',
    slug: 'noir-cap',
    description: 'Classic noir cap',
    price: 350,
    comparePrice: 499,
    category: 'Accessories',
    brand: 'GenZ',
    thumbnail: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=500',
    images: [],
    stock: 30,
    sizes: ['One Size'],
    colors: [{ name: 'Black', hex: '#000000' }],
    isFeatured: true,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore');
    console.log('✅ MongoDB Connected');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert new products
    const inserted = await Product.insertMany(PRODUCTS);
    console.log(`✅ Inserted ${inserted.length} sample products\n`);

    // Display inserted products
    const allProducts = await Product.find().select('name price stock category');
    console.log('📦 Products in Database:');
    allProducts.forEach(p => {
      console.log(`  - ${p.name}: ₹${p.price} (Stock: ${p.stock})`);
    });

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
