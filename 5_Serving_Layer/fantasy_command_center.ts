/**
 * =============================================================================
 * EDGE ARCHITECTURE - LAYER 5: SERVING LAYER
 * File: fantasy_command_center.ts
 *
 * PURPOSE:
 *   Predictive team-building service and tactical recommendation controller
 *   aggregating form scores, pitch conditions, and player valuations.
 * =============================================================================
 */

export interface FantasyPick {
  id: number;
  name: string;
  role: string;
  type: string;
  pts: string;
  desc: string;
}

export interface FantasyPredictionResponse {
  topPicks: FantasyPick[];
  sleepers: FantasyPick[];
  analysis: string;
}

export async function generateFantasyPredictions(matchQuery: string): Promise<FantasyPredictionResponse> {
  const res = await fetch('/api/fantasy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match: matchQuery })
  });

  if (!res.ok) {
    throw new Error('Failed to generate fantasy predictions');
  }

  return res.json();
}
