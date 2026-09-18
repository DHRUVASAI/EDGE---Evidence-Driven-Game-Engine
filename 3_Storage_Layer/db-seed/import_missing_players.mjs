// import_missing_players.mjs
// Imports all players from Sportmonks CSV that don't exist in DB yet
// Run from: C:\Users\dhruv\Downloads\sport\cricmetrics

import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const prisma = new PrismaClient();
const CSV_PATH = resolve("../players_data_with_all_info.csv");

function normalise(name) {
  return name?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function parseDate(raw) {
  if (!raw) return null;
  const [d, m, y] = raw.trim().split("-");
  if (!d || !m || !y) return null;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : date;
}

async function main() {
  console.log("Loading existing players from DB...");
  const dbPlayers = await prisma.player.findMany({
    select: { name: true, fullName: true },
  });

  // Build set of existing names
  const existingNames = new Set();
  for (const p of dbPlayers) {
    if (p.fullName) existingNames.add(normalise(p.fullName));
    existingNames.add(normalise(p.name));
  }
  console.log(`Existing players in DB: ${dbPlayers.length}\n`);

  // Stream CSV
  const rl = createInterface({
    input: createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let headers = null;
  let toInsert = [];
  let alreadyExists = 0;

  for await (const line of rl) {
    if (!headers) {
      headers = line.split(",");
      continue;
    }

    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = cols[i]?.trim() ?? ""));

    const fullname = row["fullname"];
    if (!fullname) continue;

    if (existingNames.has(normalise(fullname))) {
      alreadyExists++;
      continue;
    }

    toInsert.push({
      name: fullname,
      fullName: fullname,
      country: row["country_name"] || null,
      role: row["position"] || null,
      battingStyle: row["battingstyle"] || null,
      bowlingStyle: row["bowlingstyle"] || null,
      imageUrl: row["image_path"] || null,
      dob: parseDate(row["dateofbirth"]),
    });
  }

  console.log(`Already in DB: ${alreadyExists}`);
  console.log(`New players to insert: ${toInsert.length}\n`);

  // Insert in batches of 200
  const BATCH = 200;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH);
    await prisma.player.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += chunk.length;
    process.stdout.write(`\r➕ Inserted: ${inserted}/${toInsert.length}`);
  }

  console.log(`\n\nDone!`);
  console.log(`➕ Inserted: ${inserted} new players`);
  console.log(`✅ Already existed: ${alreadyExists}`);
  console.log(`📊 Total players now: ~${dbPlayers.length + inserted}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
