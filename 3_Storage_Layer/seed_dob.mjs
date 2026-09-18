import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const dobMap = JSON.parse(readFileSync(join(__dirname, "playerDob.json"), "utf8"));

async function main() {
  console.log("Seeding player DOBs...");
  let updated = 0;

  for (const [espnId, data] of Object.entries(dobMap)) {
    if (!data.dob) continue;
    const result = await prisma.player.updateMany({
      where: { espnId },
      data: { dob: new Date(data.dob) },
    });
    if (result.count > 0) {
      console.log(`✅ ${data.name} — ${data.dob}`);
      updated++;
    }
  }

  console.log(`\nDone! ${updated} players updated with DOB.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
