import { PrismaClient } from '@prisma/client';

// Single shared Prisma instance. In dev with nodemon this can create
// duplicate connections on hot-reload; guard via globalThis.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
