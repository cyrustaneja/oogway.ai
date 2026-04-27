
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    console.log("Testing connection...")
    // Just try a simple query
    const result = await prisma.$queryRaw`SELECT 1`
    console.log("Connection successful:", result)
  } catch (e) {
    console.error("Connection failed:", e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
