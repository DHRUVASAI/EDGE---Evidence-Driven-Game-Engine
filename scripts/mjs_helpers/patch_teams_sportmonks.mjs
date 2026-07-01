// patch_teams_sportmonks.mjs
// Run from: C:\Users\dhruv\Downloads\sport\cricmetrics
// CSV path:  C:\Users\dhruv\Downloads\sport\teams.csv
//
// Usage: node patch_teams_sportmonks.mjs

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();
const CSV_PATH = resolve("../teams.csv");

function normalise(name) {
  return name?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

async function main() {
  const lines = readFileSync(CSV_PATH, "utf8").trim().split("\n");
  const headers = lines[0].split(",");

  const csvTeams = lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = cols[i]?.trim() ?? ""));
    return row;
  });

  console.log(`Found ${csvTeams.length} teams in CSV\n`);

  let updated = 0;
  let skipped = 0;

  for (const team of csvTeams) {
    const name = team["name"];
    const logoUrl = team["image_path"];
    const shortName = team["code"];
    const isNational = team["national_team"] === "TRUE";

    if (!name || !logoUrl) { skipped++; continue; }

    // Try exact match first, then normalised
    const result = await prisma.teamMeta.updateMany({
      where: { name: { equals: name, mode: "insensitive" } },
      data: {
        logoUrl,
        shortName,
        type: isNational ? "international" : "IPL",
      },
    });

    if (result.count > 0) {
      console.log(`✅ ${name} — ${logoUrl}`);
      updated++;
    } else {
      // Team not in DB yet — create it
      await prisma.teamMeta.upsert({
        where: { name },
        update: { logoUrl, shortName, type: isNational ? "international" : "IPL" },
        create: {
          name,
          shortName,
          logoUrl,
          type: isNational ? "international" : "IPL",
        },
      });
      console.log(`➕ Created: ${name}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated/created: ${updated} | Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
