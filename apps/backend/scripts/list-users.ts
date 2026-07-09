import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log('Users in database:');
  console.table(users.map(u => ({
    Phone: u.phone,
    Email: u.email,
    Name: `${u.firstName} ${u.lastName}`,
    Role: u.role,
    Active: u.isActive,
    Created: u.createdAt.toISOString(),
  })));

  await prisma.$disconnect();
}

listUsers().catch(console.error);
