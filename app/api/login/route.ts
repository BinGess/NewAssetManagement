import { NextResponse } from 'next/server';
import { verifyPassword } from '../../../lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}