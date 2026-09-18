import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.player.count();
  const espnCount = await prisma.player.count({ where: { espnId: { not: null } } });
  console.log(`Total players: ${count}`);
  console.log(`Players with espnId: ${espnCount}`);
  
  // print a sample player
  const sample = await prisma.player.findFirst();
  console.log('Sample player:', sample);
}

check().catch(console.error).finally(() => prisma.$disconnect());
