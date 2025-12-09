export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const body = await req.json();
  const updated = await prisma.person.update({ where: { id: Number(params.id) }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const count = await prisma.expense.count({ where: { personId: Number(params.id) } });
  if (count > 0) return NextResponse.json({ error: 'person has related expenses' }, { status: 400 });
  await prisma.person.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}