import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { match } = await request.json();

    if (!match) {
      return NextResponse.json({ error: 'Missing match string' }, { status: 400 });
    }

    const geminiKey = process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are an expert cricket fantasy sports analyst and data scientist.
The user will provide a match (e.g. "India vs Australia" or "Chennai Super Kings vs Mumbai Indians").
Your job is to recommend top fantasy picks, sleepers, and provide a tactical match analysis.
You MUST reply ONLY with a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO extra text:
{
  "topPicks": [
    { "id": number, "name": string, "role": string, "type": string (e.g. "Captain", "Vice Captain", "Key Player"), "pts": string (e.g. "145.5"), "desc": string }
  ],
  "sleepers": [
    { "id": number, "name": string, "role": string, "pts": string, "desc": string }
  ],
  "analysis": string
}
Ensure there are exactly 3 topPicks and 2 sleepers. Provide realistic names based on the teams.`;

    let parsedData;

    try {
      if (!geminiKey) throw new Error("No Gemini key configured.");
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `Match: ${match}` }] }],
          generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gemini API failed');
      
      const content = data.candidates[0].content.parts[0].text.trim();
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
      
    } catch (geminiError: any) {
      console.warn("Gemini failed, falling back to Groq:", geminiError.message);
      
      if (!groqKey) throw new Error("Both Gemini failed and no Groq fallback key configured.");

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Upgraded model since 8b-8192 is decommissioned
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Match: ${match}` }
          ],
          temperature: 0.3,
        })
      });

      const groqData = await groqRes.json();
      if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq API failed');
      
      const content = groqData.choices[0].message.content.trim();
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/fantasy:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
