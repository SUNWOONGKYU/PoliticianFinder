/**
 * Task ID: P5M9
 * 작업명: Footer 다크모드 스타일 적용
 * 작업일: 2025-11-25
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-500 dark:bg-slate-800 text-white transition-colors duration-300 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Footer Links - 모바일: 2x2 그리드, 데스크탑: 가로 배열 */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-4 md:gap-8 py-4">
          <Link href="/services" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center justify-center sm:justify-start px-3 py-2 rounded-lg active:bg-white/10 touch-manipulation text-sm sm:text-base">서비스 소개</Link>
          <Link href="/terms" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center justify-center sm:justify-start px-3 py-2 rounded-lg active:bg-white/10 touch-manipulation text-sm sm:text-base">이용약관</Link>
          <Link href="/privacy" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center justify-center sm:justify-start px-3 py-2 rounded-lg active:bg-white/10 touch-manipulation text-sm sm:text-base">개인정보처리방침</Link>
          <Link href="/support" className="text-white hover:text-gray-100 transition font-medium min-h-[44px] flex items-center justify-center sm:justify-start px-3 py-2 rounded-lg active:bg-white/10 touch-manipulation text-sm sm:text-base">고객센터</Link>
        </div>
        {/* Copyright */}
        <div className="text-center text-sm sm:text-base text-white py-4">
          <p>&copy; 2025 PoliticianFinder. All rights reserved.</p>
          {/* Admin 링크: 모바일에서 숨김 */}
          <Link href="/admin/login" className="hidden sm:inline-block text-xs text-gray-300 hover:text-white opacity-50 hover:opacity-100 transition mt-2">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
