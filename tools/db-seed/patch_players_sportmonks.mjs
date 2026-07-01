// patch_players_sportmonks.mjs
// Run from: C:\Users\dhruv\Downloads\sport\cricmetrics
// CSV path:  C:\Users\dhruv\Downloads\sport\players_data_with_all_info.csv
//
// Usage: node patch_players_sportmonks.mjs

import { PrismaClient } from "@prisma/client";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const prisma = new PrismaClient();
const CSV_PATH = resolve("../players_data_with_all_info.csv");

function parseDate(raw) {
  if (!raw) return null;
  // format is DD-MM-YYYY
  const [d, m, y] = raw.trim().split("-");
  if (!d || !m || !y) return null;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : date;
}

function normalise(name) {
  return name?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

async function main() {
  console.log("Loading players from DB...");
  const dbPlayers = await prisma.player.findMany({
    select: { id: true, name: true, fullName: true },
  });

  // Build lookup map: normalised fullName → id
  const nameMap = new Map();
  for (const p of dbPlayers) {
    if (p.fullName) nameMap.set(normalise(p.fullName), p.id);
    nameMap.set(normalise(p.name), p.id);
  }
  console.log(`Loaded ${dbPlayers.length} players from DB\n`);

  // Stream CSV
  const rl = createInterface({
    input: createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let headers = null;
  let matched = 0;
  let skipped = 0;
  let batch = [];

  for await (const line of rl) {
    if (!headers) {
      headers = line.split(",");
      continue;
    }

    // Parse CSV row (simple split — fields don't have commas)
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = cols[i]?.trim() ?? ""));

    const fullname = row["fullname"];
    const playerId = nameMap.get(normalise(fullname));

    if (!playerId) {
      skipped++;
      continue;
    }

    const dob = parseDate(row["dateofbirth"]);
    const imageUrl = row["image_path"] || null;
    const battingStyle = row["battingstyle"] || null;
    const bowlingStyle = row["bowlingstyle"] || null;
    const role = row["position"] || null;

    batch.push({
      id: playerId,
      dob,
      imageUrl,
      battingStyle,
      bowlingStyle,
      role,
    });

    // Process in batches of 100
    if (batch.length >= 100) {
      await flushBatch(batch);
      matched += batch.length;
      process.stdout.write(`\r✅ Patched: ${matched} | Skipped: ${skipped}`);
      batch = [];
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await flushBatch(batch);
    matched += batch.length;
  }

  console.log(`\n\nDone!`);
  console.log(`✅ Patched: ${matched} players`);
  console.log(`⚠️  Skipped: ${skipped} (no name match)`);
}

async function flushBatch(batch) {
  await Promise.all(
    batch.map((p) =>
      prisma.player.update({
        where: { id: p.id },
        data: {
          ...(p.dob && { dob: p.dob }),
          ...(p.imageUrl && { imageUrl: p.imageUrl }),
          ...(p.battingStyle && { battingStyle: p.battingStyle }),
          ...(p.bowlingStyle && { bowlingStyle: p.bowlingStyle }),
          ...(p.role && { role: p.role }),
        },
      })
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
