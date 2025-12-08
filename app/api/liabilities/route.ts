import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const items = await prisma.liability.findMany({ include: { type: true }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.liability.create({ data: body });
  return NextResponse.json(created);
}