import { PrismaClient } from "@prisma/client";

// Single shared Prisma client instance for the process.
export const prisma = new PrismaClient();
