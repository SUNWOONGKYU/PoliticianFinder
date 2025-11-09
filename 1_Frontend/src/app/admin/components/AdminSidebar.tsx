'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie = 'isAdmin=; path=/; max-age=0';
    router.push('/');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-700">
        <Link href="/">PoliticianFinder</Link>
        <span className="text-sm font-normal block">Admin Panel</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive('/admin') ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span>대시보드</span>
        </Link>
        <Link
          href="/admin/users"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive('/admin/users') ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A4.978 4.978 0 0112 13a4.978 4.978 0 01-3-1.197m0 0A4.992 4.992 0 0012 13a4.992 4.992 0 00-3-1.197z"></path>
          </svg>
          <span>회원 관리</span>
        </Link>
        <Link
          href="/admin/politicians"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive('/admin/politicians') ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span>정치인 관리</span>
        </Link>
        <Link
          href="/admin/posts"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive('/admin/posts') ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>콘텐츠 관리</span>
        </Link>
        <Link
          href="/admin/reports"
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive('/admin/reports') ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
          <span>신고 관리</span>
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">12</span>
        </Link>
      </nav>
      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <img className="w-10 h-10 rounded-full" src="https://i.pravatar.cc/100?u=admin" alt="Admin" />
          <div>
            <p className="font-semibold">관리자</p>
            <p className="text-sm text-gray-400">온라인</p>
          </div>
        </div>
        <div className="space-y-2">
          <Link href="/" className="block w-full text-center py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            메인으로
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-center py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>
    </aside>
  );
}
