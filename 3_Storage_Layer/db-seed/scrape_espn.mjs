import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPlayerFromEspn(espnId) {
  try {
    const url = `https://www.espncricinfo.com/ci/content/player/${espnId}.html`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const html = await res.text();

    // Extract DOB
    const dobMatch = html.match(/Born[^<]*<[^>]+>([^<]+)<\/[^>]+>/);
    const dobRaw = dobMatch ? dobMatch[1].trim() : null;
    let dob = null;
    if (dobRaw) {
      const parsed = new Date(dobRaw.replace(/\(.*\)/, "").trim());
      if (!isNaN(parsed.getTime())) dob = parsed;
    }

    // Extract bio/description
    const bioMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const bio = bioMatch ? bioMatch[1].trim() : null;

    return { dob, bio };
  } catch {
    return { dob: null, bio: null };
  }
}

async function main() {
  // Get top 200 players with espnId, ordered by those with most data
  const players = await prisma.player.findMany({
    where: { espnId: { not: null } },
    take: 200,
    orderBy: { createdAt: "asc" },
  });

  console.log(`Scraping ${players.length} players from ESPN...`);
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (!player.espnId) continue;

    process.stdout.write(`[${i + 1}/${players.length}] ${player.fullName || player.name}... `);
    const { dob, bio } = await fetchPlayerFromEspn(player.espnId);

    if (dob || bio) {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          ...(dob && { dob }),
          ...(bio && { bio }),
        },
      });
      console.log(`✅ dob=${dob?.toISOString().split("T")[0] ?? "—"} bio=${bio ? "yes" : "—"}`);
      updated++;
    } else {
      console.log(`⚠️ no data`);
      failed++;
    }

    // Be polite to ESPN — 1 request per second
    await delay(1000);
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
