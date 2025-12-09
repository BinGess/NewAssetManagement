export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { AssetUpdateSchema } from '../../../../lib/schemas';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.asset.findUnique({ where: { id: Number(params.id) }, include: { type: true } });
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const prev = await prisma.asset.findUnique({ where: { id: Number(params.id) } });
  const json = await req.json();
  const parsed = AssetUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.asset.update({ where: { id: Number(params.id) }, data: parsed.data });
  if (prev && prev.amount !== undefined) {
    const before = Number(prev.amount);
    const after = Number(parsed.data.amount);
    if (!Number.isNaN(before) && !Number.isNaN(after) && before !== after) {
      await prisma.assetChange.create({ data: { assetId: Number(params.id), beforeAmount: before, afterAmount: after, diff: after - before, notes: parsed.data.notes || undefined } });
    }
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  await prisma.asset.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}