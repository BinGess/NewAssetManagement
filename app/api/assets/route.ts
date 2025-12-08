export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { AssetCreateSchema } from '../../../lib/schemas';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const items = await prisma.asset.findMany({ include: { type: true }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const json = await req.json();
  const parsed = AssetCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.asset.create({ data: parsed.data });
  return NextResponse.json(created);
}