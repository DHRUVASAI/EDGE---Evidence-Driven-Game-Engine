// patch_players_v2.mjs
// Improved matching: tries fullname, then lastname+initial, then lastname only
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

// "Virat Kohli" → "v kohli"
function initialLastName(fullname) {
  const parts = fullname.trim().split(" ");
  if (parts.length < 2) return null;
  return `${parts[0][0].toLowerCase()} ${parts[parts.length - 1].toLowerCase()}`;
}

// "Virat Kohli" → "kohli"
function lastName(fullname) {
  const parts = fullname.trim().split(" ");
  return parts[parts.length - 1].toLowerCase();
}

async function main() {
  console.log("Loading players from DB...");
  const dbPlayers = await prisma.player.findMany({
    select: { id: true, name: true, fullName: true, country: true },
  });

  // Build multiple lookup maps
  const exactMap = new Map();      // "virat kohli" → [id]
  const initialMap = new Map();    // "v kohli" → [id]
  const lastNameMap = new Map();   // "kohli" → [id]

  for (const p of dbPlayers) {
    const names = [p.fullName, p.name].filter(Boolean);
    for (const n of names) {
      const norm = normalise(n);
      // exact
      if (!exactMap.has(norm)) exactMap.set(norm, []);
      exactMap.get(norm).push(p.id);
      // initial+last (only if DB name is already abbreviated like "V Kohli")
      const init = initialLastName(n);
      if (init) {
        if (!initialMap.has(init)) initialMap.set(init, []);
        initialMap.get(init).push(p.id);
      }
      // last name only
      const last = lastName(n);
      if (last.length > 3) {
        if (!lastNameMap.has(last)) lastNameMap.set(last, []);
        lastNameMap.get(last).push(p.id);
      }
    }
  }

  console.log(`Loaded ${dbPlayers.length} players from DB\n`);

  const rl = createInterface({
    input: createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let headers = null;
  let matched = 0;
  let skipped = 0;
  let ambiguous = 0;
  const updates = [];

  for await (const line of rl) {
    if (!headers) {
      headers = line.split(",");
      continue;
    }

    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = cols[i]?.trim() ?? ""));

    const fullname = row["fullname"];
    if (!fullname) { skipped++; continue; }

    const norm = normalise(fullname);
    const init = initialLastName(fullname);  // "v kohli" from "Virat Kohli"
    const last = lastName(fullname);

    let playerIds = null;
    let matchType = "";

    // Strategy 1: exact full name match
    if (exactMap.has(norm)) {
      playerIds = exactMap.get(norm);
      matchType = "exact";
    }
    // Strategy 2: CSV fullname → abbreviated form matches DB "V Kohli"
    else if (init && initialMap.has(init) && initialMap.get(init).length === 1) {
      playerIds = initialMap.get(init);
      matchType = "initial";
    }
    // Strategy 3: last name only — only if unique
    else if (last.length > 4 && lastNameMap.has(last) && lastNameMap.get(last).length === 1) {
      playerIds = lastNameMap.get(last);
      matchType = "lastname";
    }

    if (!playerIds || playerIds.length === 0) { skipped++; continue; }
    if (playerIds.length > 1) { ambiguous++; continue; } // skip ambiguous

    const playerId = playerIds[0];
    const dob = parseDate(row["dateofbirth"]);
    const imageUrl = row["image_path"] || null;
    const battingStyle = row["battingstyle"] || null;
    const bowlingStyle = row["bowlingstyle"] || null;
    const role = row["position"] || null;

    updates.push({ id: playerId, dob, imageUrl, battingStyle, bowlingStyle, role, matchType });
  }

  console.log(`Matches found: ${updates.length} — flushing to DB...\n`);

  // Batch update
  const BATCH = 100;
  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    await Promise.all(
      chunk.map((p) =>
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
    matched += chunk.length;
    process.stdout.write(`\r✅ Patched: ${matched}/${updates.length}`);
  }

  console.log(`\n\nDone!`);
  console.log(`✅ Patched:   ${matched}`);
  console.log(`⚠️  Skipped:   ${skipped} (no match)`);
  console.log(`🔀 Ambiguous: ${ambiguous} (multiple matches, skipped safely)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
