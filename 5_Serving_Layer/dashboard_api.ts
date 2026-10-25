/**
 * =============================================================================
 * EDGE ARCHITECTURE - LAYER 5: SERVING LAYER
 * File: dashboard_api.ts
 *
 * PURPOSE:
 *   High-performance REST API handler aggregating real-time match stats,
 *   IPL team standings, leaderboards, and format breakdowns for the dashboard.
 * =============================================================================
 */

export interface DashboardSummaryResponse {
  counts: {
    totalDeliveries: number;
    totalPlayers: number;
    matchesPerFormat: Array<{ format: string; count: number }>;
  };
  seasonTrends: Array<{ season: string; count: number }>;
  topVenues: Array<{ venue: string; count: number }>;
}

export async function fetchDashboardSummary(apiBaseUrl: string): Promise<DashboardSummaryResponse> {
  const res = await fetch(`${apiBaseUrl}/api/dashboard/summary`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${res.statusText}`);
  }
  return res.json();
}
