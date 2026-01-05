export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';

function ok(data: any) { return NextResponse.json(data); }
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-job-token') || '';
  const expected = process.env.JOB_TOKEN || '';
  if (!expected || token !== expected) return unauthorized();

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const assets = await prisma.asset.findMany({
    where: {
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
    const days = Math.floor((todayStart.getTime() - new Date(lastValuation.setHours(0,0,0,0)).getTime()) / 86400000);
    const steps = days > 0 ? days : 1;

    let amount = Number(a.amount);
    for (let i = 0; i < steps; i++) {
      const interest = amount * rate / 365;
      const before = Math.round(amount * 100) / 100;
      const after = Math.round((amount + interest) * 100) / 100;
      const diff = Math.round((after - before) * 100) / 100;

      await prisma.asset.update({
        where: { id: a.id },
        data: { amount: after, valuationDate: todayStart },
      });

      await prisma.assetChange.create({
        data: {
          assetId: a.id,
          beforeAmount: before,
          afterAmount: after,
          diff,
          at: todayStart,
          notes: '自动收益(日复利)',
        },
      });

      amount = after;
    }

    processed++;
  }

  return ok({ processed });
}