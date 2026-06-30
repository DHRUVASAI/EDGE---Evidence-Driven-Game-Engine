import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.player.findFirst({ where: { name: 'MS Dhoni' } });
  console.log(p.id);
}
main().finally(() => prisma.$disconnect());
