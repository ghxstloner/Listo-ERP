import { AUTH_ROUTES, AUTH_TOKEN_KEY } from '@/packages/auth/constants';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.HOME, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
