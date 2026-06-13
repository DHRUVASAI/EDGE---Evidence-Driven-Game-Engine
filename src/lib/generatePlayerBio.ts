// lib/generatePlayerBio.ts

interface PlayerStats {
  name: string;
  country?: string | null;
  role?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  runs?: number;
  wickets?: number;
  matches?: number;
}

export async function generatePlayerBio(stats: PlayerStats): Promise<string | null> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return null;

  const prompt = `Write a 2-sentence professional cricket biography for ${stats.name}.
Facts:
- Country: ${stats.country || "Unknown"}
- Role: ${stats.role || "Cricketer"}
- Batting style: ${stats.battingStyle || "Unknown"}
- Bowling style: ${stats.bowlingStyle || "Unknown"}
- Career runs: ${stats.runs ?? "N/A"}
- Career wickets: ${stats.wickets ?? "N/A"}
- Matches played: ${stats.matches ?? "N/A"}

Write in third person. Be factual and concise. Max 60 words. No intro, just the bio.`;

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

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
