
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@kraftshala.com";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email,
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      name: "Admin User",
    },
  });

  console.log(`Admin user created/updated with ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
