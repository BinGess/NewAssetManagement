export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { TypeCreateSchema } from '../../../lib/schemas';

export async function GET() {
  const types = await prisma.assetType.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const json = await req.json();
  const parsed = TypeCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const maxOrder = await prisma.assetType.aggregate({ _max: { order: true } });
  const created = await prisma.assetType.create({
    data: {
      ...parsed.data,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  return NextResponse.json(created);
}