import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const teams = [
  // IPL Teams
  { name: "Mumbai Indians", shortName: "MI", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316659.png", country: "India", type: "IPL" },
  { name: "Chennai Super Kings", shortName: "CSK", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316647.png", country: "India", type: "IPL" },
  { name: "Royal Challengers Bengaluru", shortName: "RCB", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316663.png", country: "India", type: "IPL" },
  { name: "Kolkata Knight Riders", shortName: "KKR", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316655.png", country: "India", type: "IPL" },
  { name: "Delhi Capitals", shortName: "DC", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316649.png", country: "India", type: "IPL" },
  { name: "Punjab Kings", shortName: "PBKS", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316661.png", country: "India", type: "IPL" },
  { name: "Rajasthan Royals", shortName: "RR", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316662.png", country: "India", type: "IPL" },
  { name: "Sunrisers Hyderabad", shortName: "SRH", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316665.png", country: "India", type: "IPL" },
  { name: "Gujarat Titans", shortName: "GT", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316652.png", country: "India", type: "IPL" },
  { name: "Lucknow Super Giants", shortName: "LSG", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/316600/316657.png", country: "India", type: "IPL" },

  // International Teams
  { name: "India", shortName: "IND", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318250.png", country: "India", type: "international" },
  { name: "Australia", shortName: "AUS", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318233.png", country: "Australia", type: "international" },
  { name: "England", shortName: "ENG", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318242.png", country: "England", type: "international" },
  { name: "Pakistan", shortName: "PAK", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318259.png", country: "Pakistan", type: "international" },
  { name: "South Africa", shortName: "SA", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318264.png", country: "South Africa", type: "international" },
  { name: "New Zealand", shortName: "NZ", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318257.png", country: "New Zealand", type: "international" },
  { name: "West Indies", shortName: "WI", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318269.png", country: "West Indies", type: "international" },
  { name: "Sri Lanka", shortName: "SL", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318265.png", country: "Sri Lanka", type: "international" },
  { name: "Bangladesh", shortName: "BAN", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318235.png", country: "Bangladesh", type: "international" },
  { name: "Afghanistan", shortName: "AFG", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318229.png", country: "Afghanistan", type: "international" },
  { name: "Zimbabwe", shortName: "ZIM", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318271.png", country: "Zimbabwe", type: "international" },
  { name: "Ireland", shortName: "IRE", logoUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160/lsci/db/PICTURES/CMS/318200/318252.png", country: "Ireland", type: "international" },
];

async function main() {
  console.log("Seeding TeamMeta...");
  let count = 0;
  for (const team of teams) {
    await prisma.teamMeta.upsert({
      where: { name: team.name },
      update: { shortName: team.shortName, logoUrl: team.logoUrl, country: team.country, type: team.type },
      create: team,
    });
    count++;
    console.log(`✅ ${team.name}`);
  }
  console.log(`\nDone! ${count} teams seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
