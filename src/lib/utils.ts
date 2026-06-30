export function getPlayerImageUrl(urlOrId: string | null): string | null {
  if (!urlOrId) return null;
  
  if (/^\d+$/.test(urlOrId)) {
    return `https://img1.hscicdn.com/image/upload/f_auto,t_h_100/lsci/db/PICTURES/CMS/${urlOrId}/p${urlOrId}.png`;
  }
  
  return urlOrId;
}

export function getDisplayName(player: { fullName: string | null, name: string }): string {
  return player.fullName || player.name
}
