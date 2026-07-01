import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function test() {
  const prompt = "Write a 2-sentence professional cricket biography for MS Dhoni.";
  console.log("Calling Groq with key:", GROQ_API_KEY ? "FOUND" : "MISSING");
  
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 120,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    
    const text = await res.text();
    console.log("API STATUS:", res.status);
    console.log("RESPONSE DATA:", text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
