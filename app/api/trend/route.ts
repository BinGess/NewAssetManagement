export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

function daysFromPeriod(p?: string) {
  if (p === '6m') return 180;
  if (p === '1y') return 365;
  return 30;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';
  const days = daysFromPeriod(period);
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snaps = await prisma.snapshot.findMany({
    where: { at: { gte: from } },
    orderBy: { at: 'asc' },
    select: { at: true, totalAssets: true },
  });

  let points: { date: string; totalAssets: number }[] = snaps.map((s) => ({
    date: s.at.toISOString().slice(0, 10),
    totalAssets: Number(s.totalAssets || 0),
  }));

  if (points.length === 0) {
    const assetSum = await prisma.asset.aggregate({ _sum: { amount: true } });
    const total = Number(assetSum._sum.amount || 0);
    const now = new Date();
    points = Array.from({ length: Math.min(days, 14) }).map((_, i) => {
      const d = new Date(now.getTime() - (Math.min(days, 14) - i - 1) * 24 * 60 * 60 * 1000);
      return { date: d.toISOString().slice(0, 10), totalAssets: total };
    });
  }

  return NextResponse.json({ period, points });
}