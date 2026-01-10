export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
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

async function fetchQuotes(raws: string[]) {
  const url = `/api/quotes?symbols=${encodeURIComponent(raws.join(','))}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const j = await r.json();
  return j as Array<{ symbol: string; price: number | null; prevClose: number | null; ts: number }>;
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
    where: { ...(assetIdNum ? { id: assetIdNum } : {}), type: { is: { code: 'stock' } } },
    include: { holdings: true },
  });

  let processed = 0;
  const results: Array<{ id: number; before: number; after: number; diff: number }> = [];

  for (const a of assets) {
    const exists = await prisma.assetChange.findFirst({
      where: { assetId: a.id, at: { gte: todayStart, lte: todayEnd }, notes: { contains: '自动收盘价更新' } },
    });
    if (exists) continue;
    const raws = a.holdings.map(h => String(h.name || '').trim()).filter(Boolean);
    if (raws.length === 0) continue;
    const quotes = await fetchQuotes(raws);
    let total = 0;
    for (let i = 0; i < raws.length; i++) {
      const q = quotes[i];
      const hh = a.holdings[i];
      const p = q?.prevClose ?? null;
      if (p !== null) total += Number(p) * Number(hh.quantity);
    }
    total = Math.round(total * 100) / 100;
    const before = Math.round(Number(a.amount) * 100) / 100;
    const after = total;
    const diff = Math.round((after - before) * 100) / 100;
    await prisma.$transaction([
      prisma.asset.update({ where: { id: a.id }, data: { amount: after, valuationDate: todayStart } }),
      prisma.assetChange.create({ data: { assetId: a.id, beforeAmount: before, afterAmount: after, diff, at: new Date(todayStart.getTime() + 18 * 60 * 60000), notes: '自动收盘价更新' } }),
    ]);
    processed++;
    results.push({ id: a.id, before, after, diff });
  }

  return ok({ processed, results });
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
  const assets = await prisma.asset.findMany({ where: { ...(assetIdNum ? { id: assetIdNum } : {}), type: { is: { code: 'stock' } } }, include: { holdings: true } });
  return ok({ candidatesCount: assets.length, candidates: assets.map(a => ({ id: a.id, holdings: a.holdings })), todayStart: todayStart.toISOString(), todayEnd: todayEnd.toISOString() });
}