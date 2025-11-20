import { PrismaClient } from "@/app/generated/prisma"

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // Apenas erros e warnings essenciais
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma