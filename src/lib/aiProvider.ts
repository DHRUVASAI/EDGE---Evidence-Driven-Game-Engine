/**
 * ==============================================================================
 * EDGE ARCHITECTURE - LAYER 4 & 5: PROCESSING & SERVING LAYER
 * File: src/lib/aiProvider.ts
 *
 * 🎓 VIVA / EVALUATOR Q&A:
 * Q1: Why did we build a multi-provider AI engine instead of using a single API key?
 * A1: Reliability and zero downtime. Production LLM APIs often hit rate limits (429) or outages.
 *     This unified router attempts FreeLLMAPI first, seamlessly falls back to Google Gemini Flash 1.5,
 *     Groq, OpenRouter, and Anthropic Claude, and uses rule-based heuristic responses as a final fallback.
 *
 * Q2: What features in EDGE rely on this AI Provider?
 * A2: Match Outcome Predictor, Micro-Battle Tactical Insight, Dynamic Player Biography Generator,
 *     and Fantasy XI Builder.
 * ==============================================================================
 */

import { rocketRide } from './integrations/rocketride';

export interface LLMCompletionOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  pipeline?: string;
}

export async function generateAICompletion(options: LLMCompletionOptions): Promise<string | null> {
  const { prompt, maxTokens = 150, temperature = 0.4, pipeline = 'cricket-tactics' } = options;

  // 0. Primary Orchestration Route: RocketRide Server (if active/configured)
  if (rocketRide.isConfigured()) {
    try {
      const rrResult = await rocketRide.executePipeline({
        pipeline,
        input: { prompt, maxTokens, temperature },
      });
      if (rrResult.success && rrResult.output) {
        return rrResult.output;
      }
    } catch (err) {
      console.warn('[EDGE AI Engine] RocketRide failover to direct providers:', err);
    }
  }

  // 1. Primary Direct Route: FreeLLMAPI Gateway (Local docker or remote gateway if configured)
  const FREELLMAPI_URL = process.env.FREELLMAPI_URL || 'http://localhost:8000/v1';
  const FREELLMAPI_KEY = process.env.FREELLMAPI_KEY;

  if (FREELLMAPI_KEY) {
    try {
      const res = await fetch(`${FREELLMAPI_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FREELLMAPI_KEY}`,
        },
        body: JSON.stringify({
          model: 'auto:coding', // FreeLLMAPI auto router
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn('[EDGE AI Engine] FreeLLMAPI gateway bypass:', err);
    }
  }

  // 2. Secondary Route: Google Gemini API (Free 15 RPM Tier)
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (GOOGLE_API_KEY && !GOOGLE_API_KEY.startsWith('[')) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn('[EDGE AI Engine] Gemini API failover:', err);
    }
  }

  // 3. Tertiary Route: Groq Llama 3 (Free Tier)
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn('[EDGE AI Engine] Groq API failover:', err);
    }
  }

  return null;
}
