import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function seedSuperuser() {
  const email = process.env.SUPERUSER_EMAIL || 'admin@discoverfestac.com';
  const phone = process.env.SUPERUSER_PHONE || '+2348000000001';
  const password = process.env.SUPERUSER_PASSWORD || 'Admin@123456';
  const firstName = process.env.SUPERUSER_FIRST_NAME || 'Super';
  const lastName = process.env.SUPERUSER_LAST_NAME || 'Admin';

  // Check if superuser exists
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existing) {
    console.log('Superuser already exists:', existing.phone);
    await prisma.$disconnect();
    return;
  }

  // Create superuser
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      phone,
      email,
      firstName,
      lastName,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isPhoneVerified: true,
    },
  });

  console.log('Superuser created:');
  console.log('  Phone:', phone);
  console.log('  Email:', email);
  console.log('  Password:', password);

  await prisma.$disconnect();
}

seedSuperuser().catch(console.error);
