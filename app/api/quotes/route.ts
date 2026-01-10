export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function mapSymbol(raw: string) {
  const s = String(raw || '').trim();
  if (/^[0-9]{6}$/.test(s)) {
    if (s.startsWith('6')) return `${s}.SS`;
    if (s.startsWith('0') || s.startsWith('2') || s.startsWith('3')) return `${s}.SZ`;
  }
  if (/^[0-9]{3,5}$/.test(s)) {
    const p = s.padStart(4, '0');
    return `${p}.HK`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols') || '';
  const raws = symbolsParam.split(',').map(x => x.trim()).filter(Boolean);
  if (raws.length === 0) return NextResponse.json([]);
  const mapped = raws.map(mapSymbol).join(',');
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(mapped)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return NextResponse.json(raws.map(s => ({ symbol: s, price: null, prevClose: null, ts: Date.now() })));
    const j = await r.json();
    const arr = (j?.quoteResponse?.result || []);
    const map: Record<string, any> = {};
    for (const it of arr) {
      map[it.symbol] = it;
    }
    const out = raws.map((raw) => {
      const sym = mapSymbol(raw);
      const it = map[sym];
      const price = it?.regularMarketPrice ?? null;
      const prevClose = it?.regularMarketPreviousClose ?? null;
      const ts = it?.regularMarketTime ? it.regularMarketTime * 1000 : Date.now();
      return { symbol: raw, price, prevClose, ts };
    });
    return NextResponse.json(out);
  } catch {
    return NextResponse.json(raws.map(s => ({ symbol: s, price: null, prevClose: null, ts: Date.now() })));
  }
}