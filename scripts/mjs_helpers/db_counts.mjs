import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const counts = {
    players: await prisma.player.count(),
    matches: await prisma.match.count(),
    deliveries: await prisma.delivery.count(),
    careerStats: await prisma.careerStat.count(),
    auctionHistories: await prisma.auctionHistory.count()
  };
  
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
