/**
 * Task ID: P5M9
 * 작업명: Footer 다크모드 스타일 적용
 * 작업일: 2025-11-25
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-500 dark:bg-slate-800 text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        {/* Footer Links - 모바일: 한 줄 가로 스크롤, 데스크탑: 가로 배열 */}
        <div className="flex justify-center gap-x-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          <Link href="/services" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 sm:px-3 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-xs sm:text-sm">서비스 소개</Link>
          <Link href="/terms" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 sm:px-3 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-xs sm:text-sm">이용약관</Link>
          <Link href="/privacy" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 sm:px-3 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-xs sm:text-sm">개인정보처리방침</Link>
          <Link href="/support" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center px-2 sm:px-3 whitespace-nowrap rounded-lg active:bg-white/10 touch-manipulation text-xs sm:text-sm">고객센터</Link>
        </div>
        {/* Copyright */}
        <div className="text-center text-xs sm:text-sm text-white/80 pt-2 pb-1">
          <p>&copy; 2025 PoliticianFinder</p>
          {/* Admin 링크: 모바일에서 숨김 */}
          <Link href="/admin/login" className="hidden sm:inline-block text-xs text-gray-300 hover:text-white opacity-50 hover:opacity-100 transition mt-1">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
