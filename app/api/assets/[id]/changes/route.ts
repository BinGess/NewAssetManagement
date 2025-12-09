export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';
import { AssetChangeCreateSchema } from '../../../../../lib/schemas';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const list = await prisma.assetChange.findMany({
    where: { assetId: Number(params.id) },
    orderBy: { at: 'desc' },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const json = await req.json();
  const parsed = AssetChangeCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const { beforeAmount, afterAmount, notes } = parsed.data;
  const diff = afterAmount - beforeAmount;
  const created = await prisma.assetChange.create({ data: { assetId: Number(params.id), beforeAmount, afterAmount, diff, notes } });
  return NextResponse.json(created);
}