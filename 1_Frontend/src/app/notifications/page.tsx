// P3BA28: 알림 시스템 API 연동
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'post_like' | 'comment' | 'follow' | 'payment' | 'system' | 'reply' | 'mention';
  content: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

const SAMPLE_NOTIFICATIONS_BACKUP: any[] = [
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
    type: 'post_like',
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
    type: 'follow',
    title: '게시글이 공유되었습니다',
    content: '정치관심러님이 "예산안 검토 의견" 게시글을 공유했습니다.',
    timestamp: '2025-01-28T12:45:00',
    read: false,
    link: '/community/posts/4',
  },
  {
    id: 5,
    type: 'system',
    title: '새로운 공지사항이 등록되었습니다',
    content: '서비스 이용약관 변경 안내 - 2025년 2월 1일부터 변경된 약관이 적용됩니다.',
    timestamp: '2025-01-28T10:00:00',
    read: false,
    link: '/notice-detail',
  },
  {
    id: 6,
    type: 'payment',
    title: '관심 정치인의 새 글이 등록되었습니다',
    content: '김민준 의원님이 "2025년 1월 활동 보고" 글을 작성하셨습니다.',
    timestamp: '2025-01-28T09:30:00',
    read: false,
    link: '/politicians/1',
  },
  {
    id: 7,
    type: 'post_like',
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
    type: 'follow',
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'post_like' | 'comment' | 'follow' | 'payment' | 'system' | 'reply' | 'mention'>('all');

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'mention':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case 'post_like':
        return <span className="text-2xl">👍</span>;
      case 'follow':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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

  const handleMarkAllRead = async () => {
    try {
      // 읽지 않은 알림들을 모두 읽음 처리
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
    // 링크가 있으면 이동
    if (notification.target_url) {
      window.location.href = notification.target_url;
    }
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
            {['all', 'comment', 'reply', 'mention', 'post_like', 'follow', 'payment', 'system'].map((filter) => (
              <button
                key={filter}
                onClick={() => setCurrentFilter(filter as any)}
                className={`px-6 py-3 text-gray-600 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-600 transition-colors whitespace-nowrap ${
                  currentFilter === filter ? 'text-primary-600 border-primary-600 font-bold' : ''
                }`}
              >
                {filter === 'all' && '전체'}
                {filter === 'comment' && '댓글'}
                {filter === 'reply' && '답글'}
                {filter === 'mention' && '멘션'}
                {filter === 'post_like' && '공감'}
                {filter === 'follow' && '공유'}
                {filter === 'payment' && '정치인'}
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
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {!notification.is_read && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                          알림
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
                      <span className="text-xs text-gray-500">{formatTimestamp(notification.created_at)}</span>
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
