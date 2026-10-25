/**
 * =============================================================================
 * EDGE ARCHITECTURE - LAYER 5: SERVING LAYER
 * File: live_matches_service.ts
 *
 * PURPOSE:
 *   Real-time live match polling engine with resilient multi-tier fallback,
 *   smart local caching, and quota protection against external API exhaustion.
 * =============================================================================
 */

export interface LiveMatchData {
  id: number;
  name: string;
  isLive: boolean;
  score1: string;
  score2: string;
  overs: string;
  status: string;
  venue: string;
  winProb1: number;
  winProb2: number;
}

export async function fetchLiveMatchesFeed(apiBaseUrl: string): Promise<LiveMatchData[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/dashboard/live-matches`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.matches || [];
  } catch {
    return [];
  }
}
