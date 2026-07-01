import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const count = await prisma.player.count();
console.log(`Player count: ${count}`);
await prisma.$disconnect();
