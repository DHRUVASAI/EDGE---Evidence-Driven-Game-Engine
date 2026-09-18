import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const r = await prisma.$queryRawUnsafe('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
console.log(r);
await prisma.$disconnect();
