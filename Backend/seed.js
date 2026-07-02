const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const Product = require('./models/productModel');
const User = require('./models/userModel');

const mockProducts = [
  {
    slug: 'soliva-airshield-wrap',
    name: 'Soliva AirShield Wrap',
    description: 'Sculpted coverage. Silent confidence. The flagship dual-layer edition.',
    price: 799,
    compareAtPrice: 1200,
    currency: 'INR',
    images: [{ url: '/product_images/IMG_6211.jpg' }],
    category: 'protection',
    tags: ['Advanced UV Defense', 'Breathable', 'Full Coverage'],
    stock: 100,
    ratings: 4.9,
    reviewsCount: 312,
  },
  {
    slug: 'soliva-urban-veil',
    name: 'Soliva Urban Veil',
    description: 'City-weight protection. Zero compromise. Engineered for the daily commute.',
    price: 799,
    compareAtPrice: 1200,
    currency: 'INR',
    images: [{ url: '/product_images/IMG_6210.png' }],
    category: 'protection',
    tags: ['Advanced UV Defense', 'Lightweight', 'Daily Wear'],
    stock: 100,
    ratings: 4.8,
    reviewsCount: 204,
  },
  {
    slug: 'soliva-heatguard',
    name: 'Soliva HeatGuard',
    description: 'Thermal intelligence. All-day calm. Built for peak exposure hours.',
    price: 799,
    compareAtPrice: 1200,
    currency: 'INR',
    images: [{ url: '/product_images/IMG_6209.jpg' }],
    category: 'protection',
    tags: ['Heat Reflective', 'Advanced UV Defense', 'All-Day Comfort'],
    stock: 100,
    ratings: 4.7,
    reviewsCount: 178,
  },
  {
    slug: 'soliva-motioncover',
    name: 'Soliva MotionCover',
    description: 'Adaptive stretch-soft fabric. Moves with you. Stays in place.',
    price: 799,
    compareAtPrice: 1200,
    currency: 'INR',
    images: [{ url: '/product_images/IMG_6212.jpg' }],
    category: 'protection',
    tags: ['Advanced UV Defense', 'Stretch-Soft', 'Indian Climate'],
    stock: 100,
    ratings: 4.8,
    reviewsCount: 142,
  },
  {
    slug: 'soliva-airlite-shield',
    name: 'Soliva AirLite Shield',
    description: 'Barely there. Completely covered. The lightest in the collection.',
    price: 799,
    compareAtPrice: 1200,
    currency: 'INR',
    images: [{ url: '/product_images/IMG_6208.jpg' }],
    category: 'protection',
    tags: ['Ultra-Light', 'Advanced UV Defense', 'Breathable'],
    stock: 100,
    ratings: 4.6,
    reviewsCount: 96,
  },
];

const seedDB = async () => {
  await connectDB();

  try {
    await Product.deleteMany();

    // Admin bootstrap credentials are read from the environment so no real
    // secret is committed. The defaults below are dev-only placeholders — set
    // SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in the environment for production.
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@soliva.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'SolivaAdmin!2026_secure';

    await User.deleteMany({ email: adminEmail });
    const adminUser = await User.create({
      name: 'Admin User',
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    const productsWithUser = mockProducts.map(p => ({
      ...p,
      user: adminUser._id
    }));

    await Product.insertMany(productsWithUser);

    console.log('Data successfully seeded!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
