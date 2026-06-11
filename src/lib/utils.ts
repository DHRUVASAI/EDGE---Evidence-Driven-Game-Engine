export function getPlayerImageUrl(espnId: string | null): string | null {
  if (!espnId) return null
  return `https://img1.hscicdn.com/image/upload/f_auto,t_h_100/lsci/db/PICTURES/CMS/${espnId}/p${espnId}.png`
}

export function getDisplayName(player: { fullName: string | null, name: string }): string {
  return player.fullName || player.name
}
