/**
 * Task ID: P5M14
 * 작업명: M14 - 알림 센터 모바일 최적화
 * 작업일: 2025-11-25
 * 설명: 알림 페이지 모바일 최적화 및 다크모드 지원
 *       - 스와이프 삭제 기능
 *       - 모바일 터치 최적화
 *       - 다크모드 지원
 */

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'post_like' | 'comment' | 'follow' | 'payment' | 'system' | 'reply' | 'mention';
  content: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

type FilterType = 'all' | 'post_like' | 'comment' | 'follow' | 'payment' | 'system' | 'reply' | 'mention';

// 스와이프 가능한 알림 아이템 컴포넌트
const SwipeableNotificationItem: React.FC<{
  notification: Notification;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  getIcon: (type: string) => React.ReactNode;
  formatTime: (timestamp: string) => string;
}> = ({ notification, onDelete, onClick, getIcon, formatTime }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 80;
  const maxSwipe = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping || touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // 왼쪽으로만 스와이프 (삭제)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, maxSwipe));
    } else {
      setSwipeOffset(0);
    }
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwiping(false);
      return;
    }

    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) {
      // 삭제 확인
      onDelete(notification.id);
    }

    // 리셋
    setSwipeOffset(0);
    setSwiping(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="relative overflow-hidden" ref={itemRef}>
      {/* 삭제 배경 */}
      <div
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-4"
        style={{ width: swipeOffset > 0 ? `${swipeOffset}px` : '0' }}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>

      {/* 알림 콘텐츠 */}
      <div
        className={`
          relative bg-white dark:bg-slate-800 transition-transform
          ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => !swiping && onClick(notification)}
      >
        <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
          {/* 아이콘 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            {getIcon(notification.type)}
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm ${!notification.is_read ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                {!notification.is_read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                )}
                {notification.content}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatTime(notification.created_at)}
            </p>
          </div>

          {/* 삭제 버튼 (데스크톱) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="hidden sm:block flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  // P7F1: Page-level authentication protection
  const { user: authUser, loading: authLoading } = useRequireAuth();

  // P7F1: Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  // API에서 알림 데이터 가져오기
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setNotifications(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (currentFilter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === currentFilter);
  }, [notifications, currentFilter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const getNotificationIcon = useCallback((type: string) => {
    const iconClass = "w-5 h-5";

    switch (type) {
      case 'comment':
        return (
          <svg className={`${iconClass} text-blue-600 dark:text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className={`${iconClass} text-purple-600 dark:text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'mention':
        return (
          <svg className={`${iconClass} text-orange-600 dark:text-orange-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case 'post_like':
        return (
          <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'follow':
        return (
          <svg className={`${iconClass} text-green-600 dark:text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className={`${iconClass} text-yellow-600 dark:text-yellow-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'system':
      default:
        return (
          <svg className={`${iconClass} text-primary-600 dark:text-primary-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n =>
          fetch(`/api/notifications?notificationId=${n.id}`, { method: 'PATCH' })
        )
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('읽은 알림을 모두 삭제하시겠습니까?')) return;

    try {
      const readNotifications = notifications.filter(n => n.is_read);
      await Promise.all(
        readNotifications.map(n =>
          fetch(`/api/notifications?notificationId=${n.id}`, { method: 'DELETE' })
        )
      );
      setNotifications(notifications.filter(n => !n.is_read));
    } catch (err) {
      console.error('Error deleting read notifications:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?notificationId=${id}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications?notificationId=${notification.id}`, { method: 'PATCH' });
        setNotifications(notifications.map(n => (n.id === notification.id ? { ...n, is_read: true } : n)));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
    if (notification.target_url) {
      window.location.href = notification.target_url;
    }
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'comment', label: '댓글' },
    { key: 'reply', label: '답글' },
    { key: 'mention', label: '멘션' },
    { key: 'post_like', label: '공감' },
    { key: 'follow', label: '팔로우' },
    { key: 'payment', label: '결제' },
    { key: 'system', label: '시스템' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">알림</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                disabled={unreadCount === 0}
              >
                모두 읽음
              </button>
              <button
                onClick={handleDeleteAllRead}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                읽은 알림 삭제
              </button>
              <Link
                href="/settings"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="알림 설정"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            읽지 않은 알림 <span className="font-bold text-primary-600 dark:text-primary-400">{unreadCount}</span>개
          </p>

          {/* 모바일 힌트 */}
          <p className="sm:hidden text-xs text-gray-500 dark:text-gray-500 mt-2">
            💡 왼쪽으로 스와이프하여 삭제
          </p>
        </div>

        {/* 필터 탭 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide -mx-px">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentFilter(tab.key)}
                className={`
                  flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${currentFilter === tab.key
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 알림 목록 */}
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">알림을 불러오는 중...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">알림이 없습니다</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">새로운 알림이 오면 여기에 표시됩니다.</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <SwipeableNotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={handleDeleteNotification}
                  onClick={handleNotificationClick}
                  getIcon={getNotificationIcon}
                  formatTime={formatTimestamp}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
