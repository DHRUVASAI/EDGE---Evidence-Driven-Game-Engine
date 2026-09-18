export function getPlayerImageUrl(urlOrId: string | null): string | null {
  if (!urlOrId) return null;
  
  if (/^\d+$/.test(urlOrId)) {
    return `https://img1.hscicdn.com/image/upload/f_auto,t_h_100/lsci/db/PICTURES/CMS/${urlOrId}/${urlOrId}.png`;
  }
  
  return urlOrId;
}

export function getPlayerImageApiUrl(player: { imageUrl?: string | null; espnId?: string | null; name?: string | null; fullName?: string | null }): string {
  const params = new URLSearchParams();
  const imageUrl = getPlayerImageUrl(player.imageUrl || null);
  const espnImageUrl = getPlayerImageUrl(player.espnId || null);
  const name = player.fullName || player.name;

  if (imageUrl) params.set('imageUrl', imageUrl);
  if (espnImageUrl) params.set('espnId', player.espnId || '');
  if (name) params.set('name', name);

  return `/api/player-image?${params.toString()}`;
}

export function getDisplayName(player: { fullName: string | null, name: string }): string {
  return player.fullName || player.name
}
