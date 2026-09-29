/**
 * Database Seeder — Lossless-shop
 * ─────────────────────────────────
 * Run: npx ts-node src/database/seed.ts
 * or:  npm run seed  (add script in package.json)
 *
 * This seeds initial categories and sample audiophile products.
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CategorySchema } from '../schemas/category.schema.js';
import { ProductSchema } from '../schemas/product.schema.js';
import { UserSchema, UserRole } from '../schemas/user.schema.js';
import * as bcrypt from 'bcrypt';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lossless-shop';

const categories = [
  { name: 'Headphones', slug: 'headphones', description: 'Over-ear & on-ear audiophile headphones', isActive: true },
  { name: 'IEMs', slug: 'iems', description: 'In-ear monitors for critical listening', isActive: true },
  { name: 'DACs', slug: 'dacs', description: 'Digital-to-Analog Converters', isActive: true },
  { name: 'Amplifiers', slug: 'amplifiers', description: 'Headphone & speaker amplifiers', isActive: true },
  { name: 'Cables', slug: 'cables', description: 'Premium audio cables & adapters', isActive: true },
  { name: 'Accessories', slug: 'accessories', description: 'Stands, cases, and other accessories', isActive: true },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  const CategoryModel = mongoose.model('Category', CategorySchema);
  const ProductModel = mongoose.model('Product', ProductSchema);
  const UserModel = mongoose.model('User', UserSchema);

  // ─── Clear existing data ────────────────────────────────────────────────────
  await CategoryModel.deleteMany({});
  await ProductModel.deleteMany({});
  await UserModel.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ─── Seed Categories ────────────────────────────────────────────────────────
  const createdCategories = await CategoryModel.insertMany(categories);
  console.log(`✅ Seeded ${createdCategories.length} categories`);

  const categoryMap = Object.fromEntries(
    createdCategories.map((c: { slug: string; _id: unknown }) => [c.slug, c._id])
  );

  // ─── Seed Products ──────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Sennheiser HD 800 S',
      slug: 'sennheiser-hd-800-s',
      brand: 'Sennheiser',
      description: 'The reference class open-back headphone with an innovative ring radiator transducer.',
      price: 18500000,
      category: categoryMap['headphones'],
      images: [],
      stock: 5,
      rating: 4.9,
      reviewCount: 128,
      isFeatured: true,
      tags: ['reference', 'open-back', 'audiophile', 'hifi'],
      specs: {
        impedance: '300 Ω',
        frequencyResponse: '4 Hz – 51,000 Hz',
        driverType: 'Dynamic (Ring Radiator)',
        driverSize: '56mm',
        sensitivity: '102 dB',
        thd: '< 0.02%',
        weight: '330g',
        connector: '6.35mm TRS + 4.4mm Pentaconn',
        cableLength: '3m',
      },
    },
    {
      name: 'Moondrop Blessing 3',
      slug: 'moondrop-blessing-3',
      brand: 'Moondrop',
      description: 'Tribrid IEM with 1DD + 4BA + 2 Planar drivers for exceptional detail retrieval.',
      price: 7200000,
      category: categoryMap['iems'],
      images: [],
      stock: 15,
      rating: 4.7,
      reviewCount: 256,
      isFeatured: true,
      tags: ['tribrid', 'iem', 'hifi', 'detail'],
      specs: {
        impedance: '16 Ω',
        frequencyResponse: '5 Hz – 40,000 Hz',
        driverType: 'Tribrid (1DD + 4BA + 2 Planar)',
        sensitivity: '122 dB/Vrms',
        thd: '< 1%',
        connector: '2-pin 0.78mm',
        weight: '9g (each)',
      },
    },
    {
      name: 'Topping E70 Velvet',
      slug: 'topping-e70-velvet',
      brand: 'Topping',
      description: 'Flagship desktop DAC featuring the AKM AK4499EX chip with exceptional SNR.',
      price: 9800000,
      salePrice: 8500000,
      category: categoryMap['dacs'],
      images: [],
      stock: 8,
      rating: 4.8,
      reviewCount: 89,
      isFeatured: false,
      tags: ['dac', 'desktop', 'akm', 'flagship'],
      specs: {
        dacChip: 'AKM AK4499EX × 2',
        snr: '133 dB',
        thd: '-120 dB',
        frequencyResponse: '20 Hz – 20 kHz (±0.2 dB)',
        connector: 'XLR + RCA output, USB/Optical/Coaxial input',
      },
    },
  ];

  const createdProducts = await ProductModel.insertMany(products);
  console.log(`✅ Seeded ${createdProducts.length} products`);

  // ─── Seed Admin User ────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Admin@123456', salt);

  await UserModel.create({
    fullName: 'Lossless Admin',
    email: 'admin@lossless.shop',
    password: hashedPassword,
    role: UserRole.ADMIN,
    isActive: true,
  });
  console.log('✅ Seeded admin user: admin@lossless.shop / Admin@123456');

  await mongoose.disconnect();
  console.log('\n🎵 Seed completed successfully! Lossless-shop DB is ready.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
