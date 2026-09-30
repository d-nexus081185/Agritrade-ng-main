import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** SQLite's LIKE is already case-insensitive; PostgreSQL needs `mode: "insensitive"`. */
export const insensitive = (process.env.DATABASE_URL ?? "").startsWith("postgres")
  ? ({ mode: "insensitive" } as const)
  : ({} as const);
