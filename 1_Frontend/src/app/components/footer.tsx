/**
 * Task ID: P5M9
 * 작업명: Footer 회사 정보 추가
 * 작업일: 2025-12-31
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-500 dark:bg-slate-800 text-white transition-colors duration-300 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Footer Links */}
        <div className="flex justify-center gap-x-4 sm:gap-6 mb-4">
          <Link href="/services" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-sm">서비스 소개</Link>
          <Link href="/terms" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-sm">이용약관</Link>
          <Link href="/privacy" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-sm">개인정보처리방침</Link>
          <Link href="/support" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-sm">고객센터</Link>
        </div>

        {/* Company Info */}
        <div className="text-center text-xs sm:text-sm text-white/80 space-y-1">
          {/* 모바일: 2줄, 데스크탑: 1줄 */}
          <p>
            <span className="font-semibold">파인더월드</span>
            <span className="mx-2">|</span>대표자: 선웅규
          </p>
          <p>
            관리자: 선웅규(Sunny)
            <span className="mx-2">|</span>이메일: <a href="mailto:wksun999@hanmail.net" className="hover:text-white underline">wksun999@hanmail.net</a>
          </p>
          <p>
            사업자등록번호: 354-33-01641
            <span className="mx-2">|</span>서울특별시 강남구 테헤란로63길 9
          </p>
          <p className="pt-2">&copy; 2025 politicianfinder, All Rights Reserved</p>
          {/* Admin 링크: 모바일에서 숨김 */}
          <Link href="/admin/login" className="hidden sm:inline-block text-xs text-gray-300 hover:text-white opacity-50 hover:opacity-100 transition mt-1">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
