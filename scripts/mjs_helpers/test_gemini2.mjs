import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

async function test() {
  const prompt = "Write a 2-sentence professional cricket biography for MS Dhoni.";
  console.log("Calling Gemini with key:", apiKey ? "FOUND" : "MISSING");
  
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 100, temperature: 0.4 },
        }),
      }
    );
    const data = await res.json();
    console.log("API STATUS:", res.status);
    console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
