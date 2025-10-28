"use client"

import { useState, useEffect } from 'react'
import {
  Bell,
  MessageSquare,
  Heart,
  AtSign,
  Star,
  UserPlus,
  Award,
  AlertCircle,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Notification,
  NotificationType,
  NotificationPriority
} from '@/types/phase3-database'
import { NotificationBell } from './NotificationBell'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'

interface NotificationDropdownProps {
  userId?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

// 알림 타입별 아이콘
const notificationIcons: Record<NotificationType, React.ComponentType<any>> = {
  comment: MessageSquare,
  reply: MessageSquare,
  mention: AtSign,
  like: Heart,
  follow: UserPlus,
  rating: Star,
  post_update: AlertCircle,
  system: AlertCircle,
  achievement: Award,
  level_up: Award,
  badge: Award,
  warning: AlertCircle,
  announcement: AlertCircle
}

// 알림 타입별 색상
const notificationColors: Record<NotificationType, string> = {
  comment: 'text-blue-600',
  reply: 'text-blue-600',
  mention: 'text-purple-600',
  like: 'text-red-600',
  follow: 'text-green-600',
  rating: 'text-yellow-600',
  post_update: 'text-gray-600',
  system: 'text-gray-600',
  achievement: 'text-orange-600',
  level_up: 'text-orange-600',
  badge: 'text-orange-600',
  warning: 'text-red-600',
  announcement: 'text-blue-600'
}

// 우선순위별 스타일
const priorityStyles: Record<NotificationPriority, string> = {
  low: '',
  normal: '',
  high: 'border-l-4 border-l-orange-500',
  urgent: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950'
}

// 단일 알림 아이템
function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate
}: {
  notification: Notification
  onRead?: (id: number) => void
  onDelete?: (id: number) => void
  onNavigate?: (url: string) => void
}) {
  const Icon = notificationIcons[notification.type]
  const colorClass = notificationColors[notification.type]
  const priorityClass = priorityStyles[notification.priority]

  const handleClick = () => {
    if (!notification.is_read) {
      onRead?.(notification.id)
    }
    if (notification.action_url) {
      onNavigate?.(notification.action_url)
    }
  }

  return (
    <div
      className={cn(
        'p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20',
        priorityClass
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* 아이콘 */}
        <div className={cn('mt-0.5', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* 알림 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* 제목 */}
              <p className={cn(
                'text-sm font-medium',
                !notification.is_read && 'text-gray-900 dark:text-white',
                notification.is_read && 'text-gray-600 dark:text-gray-400'
              )}>
                {notification.title}
              </p>

              {/* 메시지 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {notification.message}
              </p>

              {/* 시간 */}
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ko
                })}
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRead?.(notification.id)
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(notification.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 우선순위 배지 */}
          {notification.priority === 'urgent' && (
            <Badge variant="destructive" className="mt-2 text-xs">
              긴급
            </Badge>
          )}
          {notification.priority === 'high' && (
            <Badge variant="outline" className="mt-2 text-xs border-orange-500 text-orange-600">
              중요
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// 알림 로딩 스켈레톤
function NotificationSkeleton() {
  return (
    <div className="p-3">
      <div className="flex gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  )
}

// 알림 드롭다운 컴포넌트
export function NotificationDropdown({
  userId,
  className,
  align = 'end'
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [isOpen, setIsOpen] = useState(false)

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast({
        title: "알림 로드 실패",
        description: "알림을 불러오는데 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 드롭다운 열릴 때 알림 조회
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  // 알림 읽음 처리
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        )
        toast({
          title: "알림 읽음 처리",
          description: "모든 알림을 읽음 처리했습니다."
        })
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // 알림 삭제
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(n => n.id !== notificationId)
        )
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // 페이지 이동
  const handleNavigate = (url: string) => {
    setIsOpen(false)
    window.location.href = url
  }

  // 필터링된 알림
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className={className}>
          <NotificationBell
            userId={userId}
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-[380px] p-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b">
          <DropdownMenuLabel className="text-base font-semibold">
            알림
          </DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                모두 읽음
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => window.location.href = '/settings/notifications'}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              전체
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              읽지 않음 {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          {/* 알림 목록 */}
          <ScrollArea className="h-[400px]">
            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                // 로딩 상태
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))}
                </div>
              ) : filteredNotifications.length > 0 ? (
                // 알림 목록
                <div className="divide-y">
                  {filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              ) : (
                // 빈 상태
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {activeTab === 'unread'
                      ? '읽지 않은 알림이 없습니다'
                      : '알림이 없습니다'}
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* 푸터 */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={() => window.location.href = '/notifications'}
          >
            모든 알림 보기
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}