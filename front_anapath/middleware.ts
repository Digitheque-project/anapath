import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authCookie';
import { decodeJwtPayload } from '@/lib/jwt';

const LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_URL || 'https://auth-client-dun.vercel.app/login';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(LOGIN_URL);
  }

  const payload = decodeJwtPayload(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    const response = NextResponse.redirect(LOGIN_URL);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!auth/sso|api|_next/static|_next/image|favicon.ico|assets).*)'],
};
