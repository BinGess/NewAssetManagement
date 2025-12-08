export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';
import { HoldingCreateSchema } from '../../../../../lib/schemas';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const list = await prisma.assetHolding.findMany({ where: { assetId: Number(params.id) }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const json = await req.json();
  const parsed = HoldingCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.assetHolding.create({ data: { ...parsed.data, assetId: Number(params.id) } });
  return NextResponse.json(created);
}