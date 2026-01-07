export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

function ok(data: any) { return NextResponse.json(data); }
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

function shanghaiDayBounds(base?: Date) {
  const now = base ? new Date(base) : new Date();
  const sh = new Date(now.getTime() + 8 * 60 * 60000);
  const y = sh.getUTCFullYear();
  const m = sh.getUTCMonth();
  const d = sh.getUTCDate();
  const startUTC = new Date(Date.UTC(y, m, d));
  const start = new Date(startUTC.getTime() - 8 * 60 * 60000);
  const end = new Date(start.getTime() + 24 * 60 * 60000 - 1);
  return { start, end };
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-job-token') || '';
  const expected = process.env.JOB_TOKEN || '';
  const unauthorizedResp = requireAuth(req);
  const tokenOk = !!expected && token === expected;
  if (!tokenOk && unauthorizedResp) return unauthorizedResp;

  const { start: todayStart, end: todayEnd } = shanghaiDayBounds();
  const assetIdParam = req.nextUrl.searchParams.get('assetId');
  const assetIdNum = assetIdParam ? Number(assetIdParam) : null;

  const assets = await prisma.asset.findMany({
    where: {
      ...(assetIdNum ? { id: assetIdNum } : {}),
      OR: [
        { type: { is: { code: { in: ['huobi', 'money_fund'] } } } },
        { type: { is: { label: { contains: '货币基金' } } } },
      ],
      annualRate: { not: null },
      startDate: { not: null },
    },
    include: { type: true },
  });

  let processed = 0;
  const processedIds: number[] = [];
  const changes: Array<{ assetId: number; before: number; after: number; diff: number; at: string }> = [];

  for (const a of assets) {
    const rate = Number(a.annualRate || 0);
    const startDate = a.startDate ? new Date(a.startDate) : null;
    if (!rate || !startDate) continue;
    if (startDate > todayStart) continue;

    const exists = await prisma.assetChange.findFirst({
      where: {
        assetId: a.id,
        at: { gte: todayStart, lte: todayEnd },
        notes: { contains: '自动收益' },
      },
    });
    if (exists) continue;

    const lastValuation = new Date(a.valuationDate);
    const { start: lastStart } = shanghaiDayBounds(lastValuation);
    const days = Math.floor((todayStart.getTime() - lastStart.getTime()) / 86400000);
    const steps = days > 0 ? days : 1;

    let amount = Number(a.amount);
    for (let i = 0; i < steps; i++) {
      const day = new Date(todayStart.getTime() - (steps - 1 - i) * 86400000);
      const { start: dayStart, end: dayEnd } = shanghaiDayBounds(day);
      const existed = await prisma.assetChange.findFirst({
        where: { assetId: a.id, at: { gte: dayStart, lte: dayEnd }, notes: { contains: '自动收益' } },
      });
      if (existed) continue;
      const interest = amount * rate / 365;
      const before = Math.round(amount * 100) / 100;
      const after = Math.round((amount + interest) * 100) / 100;
      const diff = Math.round((after - before) * 100) / 100;
      await prisma.$transaction([
        prisma.asset.update({ where: { id: a.id }, data: { amount: after, valuationDate: dayStart } }),
        prisma.assetChange.create({ data: { assetId: a.id, beforeAmount: before, afterAmount: after, diff, at: new Date(dayStart.getTime() + 60000), notes: '自动收益(日复利)' } }),
      ]);
      changes.push({ assetId: a.id, before, after, diff, at: new Date(dayStart.getTime() + 60000).toISOString() });
      amount = after;
    }

    processed++;
    processedIds.push(a.id);
  }

  return ok({ processed, processedIds, changes });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-job-token') || '';
  const expected = process.env.JOB_TOKEN || '';
  const unauthorizedResp = requireAuth(req);
  const tokenOk = !!expected && token === expected;
  if (!tokenOk && unauthorizedResp) return unauthorizedResp;

  const { start: todayStart, end: todayEnd } = shanghaiDayBounds();
  const assetIdParam = req.nextUrl.searchParams.get('assetId');
  const assetIdNum = assetIdParam ? Number(assetIdParam) : null;
  const assets = await prisma.asset.findMany({
    where: {
      ...(assetIdNum ? { id: assetIdNum } : {}),
      OR: [
        { type: { is: { code: { in: ['huobi', 'money_fund'] } } } },
        { type: { is: { label: { contains: '货币基金' } } } },
      ],
      annualRate: { not: null },
      startDate: { not: null },
    },
    select: { id: true, amount: true, annualRate: true, startDate: true, valuationDate: true },
  });
  return ok({ candidatesCount: assets.length, candidates: assets, todayStart: todayStart.toISOString(), todayEnd: todayEnd.toISOString() });
}