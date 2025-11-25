/**
 * Task ID: P5M9
 * 작업명: Footer 다크모드 스타일 적용
 * 작업일: 2025-11-25
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-500 dark:bg-slate-800 text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-base py-4">
          <Link href="/services" className="text-white hover:text-gray-100 transition font-medium">서비스 소개</Link>
          <Link href="/terms" className="text-white hover:text-gray-100 transition font-medium">이용약관</Link>
          <Link href="/privacy" className="text-white hover:text-gray-100 transition font-medium">개인정보처리방침</Link>
          <Link href="/support" className="text-white hover:text-gray-100 transition font-medium">고객센터</Link>
        </div>
        {/* Copyright */}
        <div className="text-center text-base text-white py-4">
          <p>&copy; 2025 PoliticianFinder. All rights reserved.</p>
          <Link href="/admin/login" className="text-xs text-gray-300 hover:text-white opacity-50 hover:opacity-100 transition">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
