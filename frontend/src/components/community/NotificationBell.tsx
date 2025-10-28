"use client"

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NotificationCountResponse } from '@/types/phase3-database'

interface NotificationBellProps {
  userId?: string
  className?: string
  onClick?: () => void
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function NotificationBell({
  userId,
  className,
  onClick,
  showBadge = true,
  size = 'md'
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      badge: 'h-4 min-w-[16px] text-[10px] px-1'
    },
    md: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      badge: 'h-5 min-w-[20px] text-xs px-1.5'
    },
    lg: {
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
      badge: 'h-6 min-w-[24px] text-sm px-2'
    }
  }

  const currentSize = sizeStyles[size]

  // 알림 개수 조회
  const fetchNotificationCount = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications/count?userId=${userId}`)
      if (response.ok) {
        const data: NotificationCountResponse = await response.json()
        setUnreadCount(data.unread_count)
        setLastFetch(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트시 알림 개수 조회
  useEffect(() => {
    fetchNotificationCount()
  }, [userId])

  // 30초마다 자동 갱신
  useEffect(() => {
    if (!userId) return

    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 30000) // 30초

    return () => clearInterval(interval)
  }, [userId])

  // 브라우저 포커스 시 갱신
  useEffect(() => {
    const handleFocus = () => {
      if (lastFetch && Date.now() - lastFetch.getTime() > 10000) {
        fetchNotificationCount()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [lastFetch, userId])

  // 알림 벨 애니메이션
  const bellAnimation = unreadCount > 0 ? 'animate-bell-ring' : ''

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative transition-all hover:bg-gray-100 dark:hover:bg-gray-800',
          currentSize.button,
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        onClick={onClick}
        disabled={isLoading}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개의 읽지 않은 알림)` : ''}`}
      >
        <Bell
          className={cn(
            currentSize.icon,
            bellAnimation,
            unreadCount > 0 && 'text-blue-600 dark:text-blue-400'
          )}
        />

        {/* 알림 배지 */}
        {showBadge && unreadCount > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center font-bold',
              currentSize.badge,
              unreadCount > 99 && 'px-1'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* 새 알림 표시 도트 */}
        {!showBadge && unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"
            aria-hidden="true"
          />
        )}
      </Button>

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
        </div>
      )}
    </div>
  )
}

// 커스텀 CSS 애니메이션 (global.css에 추가 필요)
const bellRingAnimation = `
@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
  50% { transform: rotate(-5deg); }
  60% { transform: rotate(5deg); }
  70% { transform: rotate(-2deg); }
  80% { transform: rotate(2deg); }
}

.animate-bell-ring {
  animation: bell-ring 1s ease-in-out;
}
`

// 접근성을 위한 스크린리더 전용 텍스트
export function ScreenReaderNotificationText({ count }: { count: number }) {
  return (
    <span className="sr-only">
      {count === 0
        ? '새로운 알림이 없습니다'
        : `${count}개의 읽지 않은 알림이 있습니다`}
    </span>
  )
}