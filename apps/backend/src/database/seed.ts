import { PrismaClient } from '@prisma/client';
import { generateSlug } from '@discover-festac/shared';

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

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+2348000000001' },
    update: {},
    create: {
      phone: '+2348000000001',
      email: 'admin@discoverfestac.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isPhoneVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: generateSlug(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: generateSlug(cat.name),
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isActive: true,
        sortOrder: CATEGORIES.indexOf(cat),
      },
    });
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // Sample vendor user
  const vendorUser = await prisma.user.upsert({
    where: { phone: '+2348012345678' },
    update: {
      email: 'vendor@example.com',
      firstName: 'Chukwudi',
      lastName: 'Okafor',
      role: 'VENDOR',
      isPhoneVerified: true,
    },
    create: {
      phone: '+2348012345678',
      email: 'vendor@example.com',
      firstName: 'Chukwudi',
      lastName: 'Okafor',
      role: 'VENDOR',
      isPhoneVerified: true,
    },
  });

  const foodCat = await prisma.category.findUnique({ where: { slug: 'food-restaurants' } });
  if (foodCat) {
    await prisma.vendor.upsert({
      where: { userId: vendorUser.id },
      update: {},
      create: {
        userId: vendorUser.id,
        businessName: "Mama Ngozi's Kitchen",
        slug: 'mama-ngozis-kitchen',
        description: "Authentic Nigerian home cooking in the heart of Festac. Specializing in Egusi soup, Jollof rice, Ofe Onugbu and other traditional delicacies. Family recipes passed down three generations.",
        phone: '+2348012345678',
        whatsappPhone: '+2348012345678',
        address: '21 Avenue Road, Festac Town',
        ward: 'Festac Town',
        lga: 'Amuwo-Odofin',
        state: 'Lagos',
        latitude: 6.4641,
        longitude: 3.2819,
        categoryId: foodCat.id,
        businessType: 'SERVICE',
        priceRange: 'BUDGET',
        deliveryAvailable: true,
        status: 'ACTIVE',
        verificationLevel: 'PHONE_VERIFIED',
        averageRating: 4.7,
        totalReviews: 23,
        tags: ['nigerian food', 'home cooking', 'delivery', 'festac'],
        openingHours: {
          monday: { open: '08:00', close: '21:00' },
          tuesday: { open: '08:00', close: '21:00' },
          wednesday: { open: '08:00', close: '21:00' },
          thursday: { open: '08:00', close: '21:00' },
          friday: { open: '08:00', close: '22:00' },
          saturday: { open: '09:00', close: '22:00' },
          sunday: { open: '11:00', close: '20:00' },
        },
        faqs: {
          create: [
            { question: 'Do you offer delivery?', answer: 'Yes! We deliver within Festac Town and surrounding areas. Call us to arrange delivery.', sortOrder: 0 },
            { question: 'Do you cater for events?', answer: 'Yes, we provide catering services for parties, celebrations, and corporate events. Please contact us at least 3 days in advance.', sortOrder: 1 },
            { question: 'What is your minimum order for delivery?', answer: 'Our minimum delivery order is ₦2,000. Delivery fee varies by location.', sortOrder: 2 },
          ],
        },
      },
    });
    console.log("✅ Sample vendor 'Mama Ngozi's Kitchen' seeded");
  }

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
