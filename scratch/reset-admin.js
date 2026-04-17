const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = "admin@kraftshala.com";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN"
    }
  });

  console.log(`✅ PASSWORD RESET SUCCESSFUL FOR: ${email}`);
  console.log(`NEW PASSWORD IS: ${password}`);
}

main().finally(() => prisma.$disconnect());
