import { generatePlayerBio } from "./src/lib/generatePlayerBio.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const stats = {
    name: "MS Dhoni",
    country: "India",
    role: "Wicketkeeper Batter",
    runs: 10000,
    wickets: 0,
    matches: 350
  };
  
  console.log("Calling Gemini...");
  const bio = await generatePlayerBio(stats);
  console.log("RESULT BIO:", bio);
}

test();
