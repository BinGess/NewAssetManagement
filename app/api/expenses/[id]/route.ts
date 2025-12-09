export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.expense.findUnique({ where: { id: Number(params.id) }, include: { person: true } });
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const body = await req.json();
  const updated = await prisma.expense.update({ where: { id: Number(params.id) }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  await prisma.expense.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}