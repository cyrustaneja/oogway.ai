// Last sync: 2026-05-02T12:45:00
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma ?? new PrismaClient({
  log: ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
