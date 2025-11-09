import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // /admin/login은 접근 허용 (로그인 페이지)
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // /admin 경로로 시작하는 모든 요청을 체크
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // TODO: 실제 인증 시스템 구현 시, 쿠키나 세션에서 사용자 역할(role) 확인
    // 예시: const userRole = request.cookies.get('userRole')?.value;
    // 예시: if (userRole !== 'admin') { ... }

    // 현재는 임시로 특정 쿠키 존재 여부로 체크
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

    if (!isAdmin) {
      // 관리자가 아니면 로그인 페이지로 리다이렉트
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// middleware가 실행될 경로 설정
export const config = {
  matcher: '/admin/:path*',
};
