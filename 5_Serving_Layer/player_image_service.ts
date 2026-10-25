/**
 * =============================================================================
 * EDGE ARCHITECTURE - LAYER 5: SERVING LAYER
 * File: player_image_service.ts
 *
 * PURPOSE:
 *   High-definition player studio headshot resolver with domain allowlist,
 *   PostgreSQL auto-caching, and dynamic SVG initials fallback.
 * =============================================================================
 */

const ALLOWED_DOMAINS = [
  'a.espncdn.com',
  'img1.hscicdn.com',
  'static.cricbuzz.com',
  'thumb.wikimedia.org'
];

export function isAllowedImageSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export function buildPlayerImageUrl(name: string, espnId?: string): string {
  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (espnId) params.set('espnId', espnId);
  return `/api/player-image?${params.toString()}`;
}
