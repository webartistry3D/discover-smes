import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { generateSlug } from '@discover-smes/shared';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Food & Restaurants', icon: 'utensils', color: '#E76F51', description: 'Restaurants, food vendors, caterers' },
  { name: 'Fashion & Clothing', icon: 'shirt', color: '#2D6A4F', description: 'Boutiques, tailors, fashion designers' },
  { name: 'Beauty & Wellness', icon: 'sparkles', color: '#E9C46A', description: 'Salons, spas, makeup artists' },
  { name: 'Electronics & Gadgets', icon: 'cpu', color: '#264653', description: 'Phone repairs, electronics sales' },
  { name: 'Home & Furniture', icon: 'home', color: '#A8DADC', description: 'Furniture stores, home decor' },
  { name: 'Automotive', icon: 'car', color: '#457B9D', description: 'Mechanics, spare parts, car wash' },
  { name: 'Education & Tutoring', icon: 'book', color: '#6D6875', description: 'Tutors, schools, training centres' },
  { name: 'Health & Pharmacy', icon: 'heart', color: '#E63946', description: 'Pharmacies, clinics, hospitals' },
  { name: 'Financial Services', icon: 'banknote', color: '#06D6A0', description: 'POS agents, money transfer, insurance' },
  { name: 'Supermarkets & Grocery', icon: 'shopping-basket', color: '#118AB2', description: 'Supermarkets, provisions stores' },
  { name: 'Real Estate', icon: 'building', color: '#073B4C', description: 'Property agents, landlords' },
  { name: 'Events & Entertainment', icon: 'music', color: '#FF6B6B', description: 'Event planners, DJs, photographers' },
  { name: 'Professional Services', icon: 'briefcase', color: '#4ECDC4', description: 'Lawyers, accountants, consultants' },
  { name: 'Transportation & Logistics', icon: 'truck', color: '#95E1D3', description: 'Dispatch riders, logistics' },
  { name: 'Technology & IT', icon: 'code', color: '#3D5A80', description: 'Web designers, IT support' },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  let created = 0;
  let skipped = 0;

  for (const [index, cat] of CATEGORIES.entries()) {
    const slug = generateSlug(cat.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.category.create({
      data: {
        name: cat.name,
        slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isActive: true,
        sortOrder: index,
      },
    });
    created++;
    console.log(`  ✅ Created: ${cat.name}`);
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exists): ${skipped}`);
  await prisma.$disconnect();
}

seedCategories().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
