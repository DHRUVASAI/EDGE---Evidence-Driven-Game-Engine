export function getPlayerImageUrl(urlOrId: string | null): string | null {
  if (!urlOrId) return null;

  if (/^\d+$/.test(urlOrId)) {
    return `https://a.espncdn.com/i/headshots/cricket/players/full/${urlOrId}.png`;
  }

  return urlOrId;
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
