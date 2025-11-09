'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Notification {
  id: number;
  type: 'comment' | 'like' | 'share' | 'politician_update' | 'notice' | 'system';
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  link: string;
  avatar?: string | null;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'comment',
    title: '내 게시글에 새 댓글이 달렸습니다',
    content: '박지민님이 "우리 지역 교통 문제 어떻게 생각하시나요?" 게시글에 댓글을 남겼습니다.',
    timestamp: '2025-01-28T15:30:00',
    read: false,
    link: '/community/posts/1',
  },
  {
    id: 2,
    type: 'like',
    title: '게시글에 공감을 받았습니다',
    content: '15명이 "2025년 지역 발전 계획 공유드립니다" 게시글에 공감을 눌렀습니다.',
    timestamp: '2025-01-28T14:20:00',
    read: false,
    link: '/community/posts/2',
  },
  {
    id: 3,
    type: 'comment',
    title: '내 댓글에 답글이 달렸습니다',
    content: '이서연 의원님이 회원님의 댓글에 답글을 남겼습니다.',
    timestamp: '2025-01-28T13:15:00',
    read: false,
    link: '/community/posts/3',
  },
  {
    id: 4,
    type: 'share',
    title: '게시글이 공유되었습니다',
    content: '정치관심러님이 "예산안 검토 의견" 게시글을 공유했습니다.',
    timestamp: '2025-01-28T12:45:00',
    read: false,
    link: '/community/posts/4',
  },
  {
    id: 5,
    type: 'notice',
    title: '새로운 공지사항이 등록되었습니다',
    content: '서비스 이용약관 변경 안내 - 2025년 2월 1일부터 변경된 약관이 적용됩니다.',
    timestamp: '2025-01-28T10:00:00',
    read: false,
    link: '/notice-detail',
  },
  {
    id: 6,
    type: 'politician_update',
    title: '관심 정치인의 새 글이 등록되었습니다',
    content: '김민준 의원님이 "2025년 1월 활동 보고" 글을 작성하셨습니다.',
    timestamp: '2025-01-28T09:30:00',
    read: false,
    link: '/politicians/1',
  },
  {
    id: 7,
    type: 'like',
    title: '댓글에 공감을 받았습니다',
    content: '8명이 회원님의 댓글에 공감을 눌렀습니다.',
    timestamp: '2025-01-27T18:45:00',
    read: true,
    link: '/community/posts/5',
  },
  {
    id: 8,
    type: 'comment',
    title: '내 게시글에 새 댓글이 달렸습니다',
    content: '최민수님이 "예산안에 대한 의견을 공유합니다" 게시글에 댓글을 남겼습니다.',
    timestamp: '2025-01-27T16:20:00',
    read: true,
    link: '/community/posts/6',
  },
  {
    id: 9,
    type: 'share',
    title: '게시글이 공유되었습니다',
    content: '3명이 "지역 현안 토론회 후기" 게시글을 공유했습니다.',
    timestamp: '2025-01-27T14:10:00',
    read: true,
    link: '/community/posts/7',
  },
  {
    id: 10,
    type: 'system',
    title: '포인트가 적립되었습니다',
    content: '활동 참여로 50 포인트가 적립되었습니다. (누적: 1,250 P)',
    timestamp: '2025-01-27T12:00:00',
    read: true,
    link: '/mypage',
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'comment' | 'like' | 'share' | 'politician_update' | 'notice' | 'system'>('all');

  const filteredNotifications = useMemo(() => {
    if (currentFilter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === currentFilter);
  }, [notifications, currentFilter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'like':
        return <span className="text-2xl">👍</span>;
      case 'share':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        );
      case 'politician_update':
        return (
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'notice':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteAllRead = () => {
    if (window.confirm('읽은 알림을 모두 삭제하시겠습니까?')) {
      setNotifications(notifications.filter(n => !n.read));
    }
  };

  const handleDeleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(notifications.map(n => (n.id === notification.id ? { ...n, read: true } : n)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">알림</h1>
            <div className="flex items-center gap-3">
              <button onClick={handleMarkAllRead} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                모두 읽음 처리
              </button>
              <button onClick={handleDeleteAllRead} className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                읽은 알림 삭제
              </button>
              <Link href="/settings" className="p-2 text-gray-600 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
          <p className="text-gray-600">
            읽지 않은 알림 <span className="font-bold text-primary-600">{unreadCount}</span>개
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {['all', 'comment', 'like', 'share', 'politician_update', 'notice', 'system'].map((filter) => (
              <button
                key={filter}
                onClick={() => setCurrentFilter(filter as any)}
                className={`px-6 py-3 text-gray-600 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-600 transition-colors whitespace-nowrap ${
                  currentFilter === filter ? 'text-primary-600 border-primary-600 font-bold' : ''
                }`}
              >
                {filter === 'all' && '전체'}
                {filter === 'comment' && '댓글'}
                {filter === 'like' && '공감'}
                {filter === 'share' && '공유'}
                {filter === 'politician_update' && '정치인'}
                {filter === 'notice' && '공지사항'}
                {filter === 'system' && '시스템'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="divide-y">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">알림이 없습니다</h3>
                <p className="text-gray-600">새로운 알림이 오면 여기에 표시됩니다.</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {!notification.read && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                          {notification.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                      <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
