import verifiedPlayerImages from '@/lib/player_images.json';

export function getPlayerImageUrl(urlOrIdOrName: string | null): string | null {
  if (!urlOrIdOrName) return null;

  // Direct full URL
  if (urlOrIdOrName.startsWith('http://') || urlOrIdOrName.startsWith('https://')) {
    return urlOrIdOrName;
  }

  // Pure numeric ESPN ID
  if (/^\d+$/.test(urlOrIdOrName)) {
    return `https://a.espncdn.com/i/headshots/cricket/players/full/${urlOrIdOrName}.png`;
  }

  // Check verified dictionary by name / alias
  const key = urlOrIdOrName.toLowerCase().trim();
  const dict = verifiedPlayerImages as Record<string, string>;
  if (dict[key]) {
    return dict[key];
  }

  return urlOrIdOrName;
}

export function getPlayerImageApiUrl(player: { id?: string | null; imageUrl?: string | null; espnId?: string | null; name?: string | null; fullName?: string | null }): string {
  if (player.imageUrl && player.imageUrl.includes('espncdn.com')) {
    return player.imageUrl;
  }

  const params = new URLSearchParams();
  if (player.id) params.set('id', player.id);
  const imageUrl = getPlayerImageUrl(player.imageUrl || null);
  const espnImageUrl = getPlayerImageUrl(player.espnId || null);
  const name = player.fullName || player.name;

  if (imageUrl) params.set('imageUrl', imageUrl);
  if (espnImageUrl || player.espnId) params.set('espnId', player.espnId || '');
  if (name) params.set('name', name);

  return `/api/player-image?${params.toString()}`;
}

export function getDisplayName(player: { fullName: string | null, name: string }): string {
  return player.fullName || player.name;
}
