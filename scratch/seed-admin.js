const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('adminpassword123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@kraftshala.com' },
    update: {},
    create: {
      email: 'admin@kraftshala.com',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  
  console.log('SEED: Admin user created/verified (admin@kraftshala.com / adminpassword123)');
  await prisma.$disconnect();
}

seed();
