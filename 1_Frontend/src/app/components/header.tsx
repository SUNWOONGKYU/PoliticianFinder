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
    let pollingInterval: NodeJS.Timeout | null = null;

    // 알림 개수 가져오기 함수
    const fetchUnreadCount = async (currentUser: User | null) => {
      if (!currentUser) {
        setUnreadCount(0);
        return;
      }

      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('is_read', false);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    // 초기 세션 확인
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      await fetchUnreadCount(currentUser);

      // 로그인 상태면 30초마다 알림 개수 갱신
      if (currentUser) {
        pollingInterval = setInterval(() => {
          fetchUnreadCount(currentUser);
        }, 30000);
      }
    };

    getUser();

    // 탭이 다시 활성화될 때 알림 개수 갱신
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          fetchUnreadCount(currentUser);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      // 로그아웃 시 알림 개수 초기화 및 폴링 중지
      if (!newUser) {
        setUnreadCount(0);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      } else {
        // 로그인 시 알림 개수 갱신 및 폴링 시작
        fetchUnreadCount(newUser);
        if (!pollingInterval) {
          pollingInterval = setInterval(() => {
            fetchUnreadCount(newUser);
          }, 30000);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Skip Navigation - 접근성: 키보드 사용자가 메인 콘텐츠로 바로 이동 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:font-medium"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* 테스트 중 배너 - 환경변수로 제어 */}
      {process.env.NEXT_PUBLIC_SHOW_TEST_BANNER === 'true' && (
        <div className="bg-amber-700 text-white text-center py-2 px-4 text-sm font-medium sticky top-0 z-[60]" role="alert">
          🚧 현재 테스트 중입니다. 실제 서비스가 아닙니다. 🚧
        </div>
      )}
      <header className={`bg-white dark:bg-slate-900 shadow-sm sticky ${process.env.NEXT_PUBLIC_SHOW_TEST_BANNER === 'true' ? 'top-[40px]' : 'top-0'} z-50 border-b-2 border-primary-500 transition-colors duration-300`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="메인 네비게이션">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Catchphrase */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              PoliticianFinder
            </Link>
            {/* 캐치프레이즈: sm(480px) 이상에서 표시 */}
            <div className="hidden sm:block w-56 md:w-72">
              <div className="text-purple-600 dark:text-purple-400 font-bold text-[8px] sm:text-[9px] md:text-[10px] truncate">2026 Local Elections - Find Your Great Candidate</div>
              <div className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm md:text-base truncate">AI 기반 정치인 평가 플랫폼</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">홈</Link>
            <Link href="/politicians" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">정치인</Link>
            <Link href="/community" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">커뮤니티</Link>
            <Link href="/connection" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1">연결</Link>
          </div>

          {/* Auth Buttons + Notification (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {/* 알림 아이콘 */}
            <Link
              href="/notifications"
              className="relative text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded p-1"
              aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
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
                <Link href="/auth/signup" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300">회원가입</Link>
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
              className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu - 모바일 최적화: 44px 터치 타겟, 액티브 피드백 */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 safe-area-bottom" role="menu">
            <div className="flex flex-col space-y-1">
              <Link href="/" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>홈</Link>
              <Link href="/politicians" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>정치인</Link>
              <Link href="/community" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>커뮤니티</Link>
              <Link href="/connection" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>연결</Link>
              <hr className="my-2 border-gray-200 dark:border-slate-700" />
              {!isMounted ? (
                <div className="text-gray-400 px-4 py-3 min-h-[44px]"></div>
              ) : user ? (
                <>
                  <Link href="/mypage" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>
                    {user.user_metadata?.name || user.email?.split('@')[0] || '마이페이지'}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-red-50 dark:active:bg-red-900/20 touch-manipulation"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg active:bg-gray-100 dark:active:bg-slate-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                  <Link href="/auth/signup" className="bg-primary-600 text-white px-4 py-3 min-h-[44px] rounded-lg hover:bg-primary-700 font-medium text-center flex items-center justify-center active:bg-primary-800 touch-manipulation" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
    </>
  );
}
