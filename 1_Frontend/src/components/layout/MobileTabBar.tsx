'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, UserCircle, LucideIcon } from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  {
    name: '홈',
    href: '/',
    icon: Home,
  },
  {
    name: '정치인',
    href: '/politicians',
    icon: Users,
  },
  {
    name: '커뮤니티',
    href: '/community',
    icon: MessageSquare,
  },
  {
    name: '마이페이지',
    href: '/mypage',
    icon: UserCircle,
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  // 현재 경로가 탭과 일치하는지 확인 (하위 경로 포함)
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* 하단 여백 확보 (탭바 높이만큼) */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* 모바일 탭바 (md 이상에서 숨김) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 safe-area-bottom"
        role="navigation"
        aria-label="모바일 하단 네비게이션"
      >
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex flex-col items-center justify-center
                  min-w-[64px] min-h-[44px] px-3 py-2
                  touch-manipulation
                  transition-colors duration-150
                  ${active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`
                  text-xs mt-1 font-medium
                  ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
