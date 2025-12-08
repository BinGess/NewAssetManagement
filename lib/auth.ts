import { NextRequest, NextResponse } from 'next/server';

export function requireAuth(req: NextRequest) {
  const cookie = req.cookies.get('auth');
  if (!cookie || cookie.value !== '1') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export function verifyPassword(pass: string) {
  const expected = process.env.ADMIN_PASSWORD || 'admin';
  return pass === expected;
}