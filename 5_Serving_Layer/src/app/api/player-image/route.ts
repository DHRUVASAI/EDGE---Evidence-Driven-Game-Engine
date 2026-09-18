import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl } from '@/lib/utils';
import { getEspnCricinfoPlayerImage } from '@/lib/playerImageResolver';

function svgFallback(name: string | null) {
  const initials = (name || 'P')
    .split(/\s+/).filter(Boolean)
    .map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  const hue = name
    ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 90;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},55%,18%)"/>
      <stop offset="100%" stop-color="hsl(${hue},40%,9%)"/>
    </linearGradient>
    <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},80%,70%)"/>
      <stop offset="100%" stop-color="hsl(${hue},60%,48%)"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg)"/>
  <circle cx="80" cy="62" r="30" fill="hsl(${hue},40%,22%)"/>
  <path d="M30 145 C38 110 58 95 80 95 C102 95 122 110 130 145" fill="hsl(${hue},40%,22%)"/>
  <text x="80" y="74" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui,-apple-system,Arial,sans-serif"
    font-size="36" font-weight="800" fill="url(#ac)">${initials}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('imageUrl');
  const espnId   = searchParams.get('espnId');
  const name     = searchParams.get('name');
  const id       = searchParams.get('id');

  // 1. Direct ESPN CDN imageUrl if provided
  const directUrl = getPlayerImageUrl(imageUrl);
  if (directUrl && directUrl.startsWith('http')) {
    return NextResponse.redirect(directUrl, { headers: { 'cache-control': 'public, max-age=86400' } });
  }

  // 2. Check Player table in DB if DB ID was supplied
  if (id) {
    try {
      const dbPlayer = await prisma.player.findUnique({
        where: { id },
        select: { imageUrl: true }
      });
      if (dbPlayer?.imageUrl && dbPlayer.imageUrl.startsWith('http')) {
        return NextResponse.redirect(dbPlayer.imageUrl, { headers: { 'cache-control': 'public, max-age=86400' } });
      }
    } catch { /* ignore */ }
  }

  // 3. Resolve single-source ESPN Cricinfo Headshot Photo
  if (name || id || espnId) {
    try {
      const espnPhotoUrl = await getEspnCricinfoPlayerImage(id, name, espnId);
      if (espnPhotoUrl) {
        return NextResponse.redirect(espnPhotoUrl, { headers: { 'cache-control': 'public, max-age=86400' } });
      }
    } catch { /* fall through */ }
  }

  // 4. SVG avatar fallback
  return svgFallback(name);
}
