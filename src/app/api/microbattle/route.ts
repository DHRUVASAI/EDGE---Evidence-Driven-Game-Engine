import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { matchup } = await request.json();

    if (!matchup) {
      return NextResponse.json({ error: 'Missing matchup string' }, { status: 400 });
    }

    const geminiKey = process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are an expert cricket statistician and analyst.
The user will provide a player matchup (e.g. "Virat Kohli vs Left-Arm Spin" or "Jasprit Bumrah vs Jos Buttler").
Your job is to act as the EDGE Analytics Decision Engine and provide highly accurate estimates for their head-to-head statistics and a tactical insight.
Since you don't have real-time DB access, provide your best historical estimates.
You MUST reply ONLY with a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO extra text:
{
  "avg": number,
  "sr": number,
  "dismissals": number,
  "ballsFaced": number,
  "dotPercentage": number,
  "insight": string
}`;

    let parsedData;

    try {
      if (!geminiKey) throw new Error("No Gemini key configured.");
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `Matchup: ${matchup}` }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
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
            { role: 'user', content: `Matchup: ${matchup}` }
          ],
          temperature: 0.2,
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
    console.error("Error in /api/microbattle:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
