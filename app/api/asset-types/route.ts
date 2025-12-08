export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const types = await prisma.assetType.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(types);
}

export async function POST(req: Request) {
  const data = await req.json();
  const created = await prisma.assetType.create({ data });
  return NextResponse.json(created);
}