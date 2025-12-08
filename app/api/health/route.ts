export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'up' });
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'unknown error';
    return NextResponse.json({ ok: false, db: 'down', error: msg }, { status: 500 });
  }
}