"use client"

import { useState, useEffect } from 'react'
import { Heart, ThumbsUp, Star, CheckCircle, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { LikeTargetType, LikeType, CreateLikeDto, LikeToggleResult } from '@/types/phase3-database'
import { toast } from '@/components/ui/use-toast'

interface LikeButtonProps {
  targetId: number
  targetType: LikeTargetType
  initialCount?: number
  initialLiked?: boolean
  initialLikeType?: LikeType
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'emoji'
  showCount?: boolean
  showTypes?: boolean
  onLikeChange?: (result: LikeToggleResult) => void
  className?: string
  disabled?: boolean
}

// 좋아요 타입별 아이콘과 스타일
const likeTypeConfig: Record<LikeType, {
  icon: React.ComponentType<any>
  label: string
  color: string
  hoverColor: string
}> = {
  like: {
    icon: ThumbsUp,
    label: '좋아요',
    color: 'text-blue-600',
    hoverColor: 'hover:text-blue-700'
  },
  love: {
    icon: Heart,
    label: '사랑해요',
    color: 'text-red-600',
    hoverColor: 'hover:text-red-700'
  },
  support: {
    icon: CheckCircle,
    label: '지지해요',
    color: 'text-green-600',
    hoverColor: 'hover:text-green-700'
  },
  agree: {
    icon: Star,
    label: '동의해요',
    color: 'text-yellow-600',
    hoverColor: 'hover:text-yellow-700'
  },
  helpful: {
    icon: Flame,
    label: '도움돼요',
    color: 'text-orange-600',
    hoverColor: 'hover:text-orange-700'
  }
}

// 이모지 스타일 좋아요 선택기
function EmojiLikeSelector({
  onSelect,
  currentType,
  disabled
}: {
  onSelect: (type: LikeType) => void
  currentType?: LikeType
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1 p-2">
      {Object.entries(likeTypeConfig).map(([type, config]) => {
        const Icon = config.icon
        const isSelected = currentType === type
        return (
          <TooltipProvider key={type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 transition-all',
                    isSelected && config.color,
                    isSelected && 'bg-gray-100 dark:bg-gray-800',
                    !isSelected && 'hover:scale-110'
                  )}
                  onClick={() => onSelect(type as LikeType)}
                  disabled={disabled}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isSelected && 'fill-current'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

export function LikeButton({
  targetId,
  targetType,
  initialCount = 0,
  initialLiked = false,
  initialLikeType = 'like',
  size = 'md',
  variant = 'default',
  showCount = true,
  showTypes = false,
  onLikeChange,
  className,
  disabled = false
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeType, setLikeType] = useState<LikeType>(initialLikeType)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      button: 'h-7 px-2 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      button: 'h-9 px-3 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      button: 'h-11 px-4 text-base',
      icon: 'h-5 w-5'
    }
  }

  const currentSize = sizeStyles[size]
  const currentConfig = likeTypeConfig[likeType]
  const Icon = currentConfig.icon

  // 좋아요 토글
  const toggleLike = async (type: LikeType = 'like') => {
    if (isLoading || disabled) return

    setIsLoading(true)
    setShowAnimation(true)

    try {
      const endpoint = isLiked
        ? `/api/likes/${targetType}/${targetId}`
        : '/api/likes'

      const method = isLiked ? 'DELETE' : 'POST'

      const body: CreateLikeDto | undefined = isLiked
        ? undefined
        : {
            target_type: targetType,
            target_id: targetId,
            like_type: type
          }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })

      if (response.ok) {
        const result: LikeToggleResult = await response.json()

        setIsLiked(result.is_liked)
        if (result.is_liked) {
          setLikeType(type)
          setLikeCount(prev => prev + 1)
        } else {
          setLikeCount(prev => Math.max(0, prev - 1))
        }

        onLikeChange?.(result)

        // 애니메이션 효과
        setTimeout(() => setShowAnimation(false), 600)

        // 토스트 메시지
        if (result.is_liked) {
          toast({
            title: currentConfig.label,
            description: `${currentConfig.label}를 표시했습니다.`
          })
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast({
        title: "오류 발생",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setShowSelector(false)
    }
  }

  // 좋아요 타입 선택 후 처리
  const handleLikeTypeSelect = (type: LikeType) => {
    if (isLiked && type === likeType) {
      // 이미 선택된 타입 클릭 시 취소
      toggleLike()
    } else {
      // 새로운 타입 선택 또는 변경
      toggleLike(type)
    }
  }

  // 숫자 포맷팅
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  // Variant: Emoji 스타일
  if (variant === 'emoji' && showTypes) {
    return (
      <Popover open={showSelector} onOpenChange={setShowSelector}>
        <PopoverTrigger asChild>
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'gap-2',
              isLiked && currentConfig.color,
              className
            )}
            disabled={isLoading || disabled}
          >
            <Icon
              className={cn(
                currentSize.icon,
                showAnimation && 'animate-bounce',
                isLiked && 'fill-current'
              )}
            />
            {showCount && <span>{formatCount(likeCount)}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <EmojiLikeSelector
            onSelect={handleLikeTypeSelect}
            currentType={isLiked ? likeType : undefined}
            disabled={isLoading}
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Variant: Minimal 스타일
  if (variant === 'minimal') {
    return (
      <button
        onClick={() => toggleLike()}
        disabled={isLoading || disabled}
        className={cn(
          'flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors',
          isLiked && currentConfig.color,
          isLoading && 'opacity-50 cursor-not-allowed',
          disabled && 'cursor-not-allowed',
          className
        )}
      >
        <Icon
          className={cn(
            currentSize.icon,
            showAnimation && 'animate-ping',
            isLiked && 'fill-current'
          )}
        />
        {showCount && (
          <span className={cn('font-medium', currentSize.button.split(' ')[2])}>
            {formatCount(likeCount)}
          </span>
        )}
      </button>
    )
  }

  // Variant: Default 스타일
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
            onClick={() => {
              if (showTypes) {
                setShowSelector(!showSelector)
              } else {
                toggleLike()
              }
            }}
            disabled={isLoading || disabled}
            className={cn(
              'gap-2 transition-all',
              isLiked && 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0',
              showAnimation && 'scale-110',
              className
            )}
          >
            <Icon
              className={cn(
                currentSize.icon,
                showAnimation && 'animate-spin',
                isLiked && 'fill-current'
              )}
            />
            {showCount && (
              <span className="font-medium">
                {formatCount(likeCount)}
              </span>
            )}
            {isLoading && (
              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLiked ? `${currentConfig.label} 취소` : currentConfig.label}</p>
        </TooltipContent>
      </Tooltip>

      {/* 좋아요 타입 선택 팝오버 */}
      {showTypes && showSelector && (
        <Popover open={showSelector} onOpenChange={setShowSelector}>
          <PopoverContent className="p-0 w-auto" align="start">
            <EmojiLikeSelector
              onSelect={handleLikeTypeSelect}
              currentType={isLiked ? likeType : undefined}
              disabled={isLoading}
            />
          </PopoverContent>
        </Popover>
      )}
    </TooltipProvider>
  )
}

// 좋아요 통계 표시 컴포넌트
export function LikeStats({
  targetId,
  targetType,
  className
}: {
  targetId: number
  targetType: LikeTargetType
  className?: string
}) {
  const [stats, setStats] = useState<Record<LikeType, number>>({
    like: 0,
    love: 0,
    support: 0,
    agree: 0,
    helpful: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/likes/stats/${targetType}/${targetId}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch like stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [targetId, targetType])

  if (isLoading) {
    return <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <Badge key={i} variant="outline" className="animate-pulse">
          <span className="h-3 w-12 bg-gray-200 rounded" />
        </Badge>
      ))}
    </div>
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Object.entries(stats)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => {
          const config = likeTypeConfig[type as LikeType]
          const Icon = config.icon
          return (
            <Badge
              key={type}
              variant="outline"
              className={cn('gap-1', config.color)}
            >
              <Icon className="h-3 w-3" />
              <span>{count}</span>
            </Badge>
          )
        })}
    </div>
  )
}