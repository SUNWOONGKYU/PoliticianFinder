'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();

    // 초기 세션 확인
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 사용자가 로그인했으면 알림 개수 가져오기
      if (user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadCount(count || 0);
      }
    };

    getUser();

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // 로그아웃 시 알림 개수 초기화
      if (!session?.user) {
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b-2 border-primary-500 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Catchphrase */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              PoliticianFinder
            </Link>
            <div className="hidden md:block w-48">
              <div className="font-bold text-gray-900 dark:text-gray-100" style={{ fontSize: 'clamp(0.5rem, 3vw, 1rem)', width: '100%' }}>훌륭한 정치인 찾기</div>
              <div className="text-gray-900 dark:text-gray-300 font-medium" style={{ fontSize: 'clamp(0.38rem, 2.28vw, 0.7125rem)', width: '100%' }}>AI 기반 정치인 평가 플랫폼</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">홈</Link>
            <Link href="/politicians" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">정치인</Link>
            <Link href="/community" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">커뮤니티</Link>
            <Link href="/connection" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">연결</Link>

            {/* 알림 아이콘 */}
            <Link href="/notifications" className="relative text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              {/* 알림 배지 (새 알림 있을 때) */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {!isMounted ? (
              <div className="text-gray-400 px-4 py-2"></div>
            ) : user ? (
              <>
                <Link href="/mypage" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">
                  {user.user_metadata?.name || user.email?.split('@')[0] || '마이페이지'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded">로그인</Link>
                <Link href="/auth/signup" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300">회원가입</Link>
              </>
            )}
          </div>

          {/* Mobile menu button & notification */}
          <div className="md:hidden flex items-center space-x-1">
            {/* 알림 아이콘 (모바일) - 44x44px 터치 타겟 */}
            <Link
              href="/notifications"
              className="relative text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="알림"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              {/* 알림 배지 (새 알림 있을 때) */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            {/* 햄버거 메뉴 - 44x44px 터치 타겟 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="메뉴 열기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>홈</Link>
              <Link href="/politicians" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>정치인</Link>
              <Link href="/community" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>커뮤니티</Link>
              <Link href="/connection" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>연결</Link>
              <hr className="my-2 border-gray-200 dark:border-slate-700" />
              {!isMounted ? (
                <div className="text-gray-400 px-3 py-3"></div>
              ) : user ? (
                <>
                  <Link href="/mypage" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>
                    {user.user_metadata?.name || user.email?.split('@')[0] || '마이페이지'}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 font-medium px-3 py-3"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-3 py-3" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                  <Link href="/auth/signup" className="bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 font-medium text-center" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
