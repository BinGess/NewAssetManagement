export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  const list = await prisma.expense.findMany({ include: { person: true }, orderBy: { date: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;
  const body = await req.json();
  const created = await prisma.expense.create({ data: body });
  return NextResponse.json(created);
}