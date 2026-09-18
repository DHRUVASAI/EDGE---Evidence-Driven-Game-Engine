// src/lib/generatePlayerBio.ts
import { generateAICompletion } from './aiProvider';

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

  // Route through multi-provider engine (FreeLLMAPI -> Gemini -> Groq -> Local Fallback)
  const aiBio = await generateAICompletion({ prompt, maxTokens: 120, temperature: 0.4 });
  if (aiBio) return aiBio;

  // Fallback factual bio if AI keys are unconfigured
  const countryStr = stats.country ? ` representing ${stats.country}` : '';
  const roleStr = stats.role ? ` as a ${stats.role.toLowerCase()}` : '';
  const runStr = stats.runs !== undefined && stats.runs !== null ? ` Accumulating ${stats.runs.toLocaleString()} runs across ${stats.matches || 'career'} matches` : '';
  const wicketStr = stats.wickets ? ` along with ${stats.wickets} wickets` : '';

  return `${stats.name} is an international cricketer${countryStr}${roleStr}.${runStr}${wicketStr}, playing a key role in team match strategies.`;
}
