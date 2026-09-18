import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const role = searchParams.get('role');

    if (!format || !role || (role !== 'batter' && role !== 'bowler')) {
      return NextResponse.json({ error: 'Missing or invalid format or role parameter', status: 400 }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found', status: 404 }, { status: 404 });
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        ...(role === 'batter' ? { batter: player.name } : { bowler: player.name }),
        match: { format }
      },
      select: {
        over: true,
        ball: true,
        runsBatter: true,
        runsTotal: true,
        wicket: true,
        extras: true
      },
      orderBy: [
        { match: { date: 'desc' } },
        { inning: 'asc' },
        { over: 'asc' },
        { ball: 'asc' }
      ],
      take: 200
    });

    return NextResponse.json(deliveries);
  } catch (error: any) {
    console.error('Error fetching player deliveries:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
