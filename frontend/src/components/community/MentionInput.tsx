"use client"

import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react'
import { AtSign, Search, User, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface User {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  user_type?: 'normal' | 'politician'
  is_verified?: boolean
}

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  onMentionSelect?: (user: User) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  searchUsers?: (query: string) => Promise<User[]>
  className?: string
  textareaClassName?: string
  popoverClassName?: string
  showFullName?: boolean
  allowMultiple?: boolean
  triggerChar?: string
  minSearchLength?: number
}

// 멘션 추출 유틸리티
function extractMentions(text: string, triggerChar: string = '@'): string[] {
  const regex = new RegExp(`${triggerChar}(\\w+)`, 'g')
  const matches = text.match(regex)
  return matches ? matches.map(m => m.slice(1)) : []
}

// 현재 멘션 위치 찾기
function getCurrentMention(
  text: string,
  cursorPos: number,
  triggerChar: string = '@'
): { start: number; end: number; query: string } | null {
  // 커서 위치 이전 텍스트에서 마지막 @ 찾기
  const beforeCursor = text.slice(0, cursorPos)
  const lastTriggerIndex = beforeCursor.lastIndexOf(triggerChar)

  if (lastTriggerIndex === -1) return null

  // @ 이후 텍스트 추출
  const afterTrigger = text.slice(lastTriggerIndex + 1)
  const match = afterTrigger.match(/^(\w*)/)

  if (!match) return null

  return {
    start: lastTriggerIndex,
    end: lastTriggerIndex + 1 + match[1].length,
    query: match[1]
  }
}

// 사용자 검색 목록 컴포넌트
function UserSearchList({
  users,
  onSelect,
  selectedIndex,
  isLoading
}: {
  users: User[]
  onSelect: (user: User) => void
  selectedIndex: number
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>사용자를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="p-1">
        {users.map((user, index) => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={cn(
              'w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left',
              selectedIndex === index && 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback className="text-xs">
                {user.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium truncate">
                  @{user.username}
                </span>
                {user.is_verified && (
                  <CheckCircle className="h-3 w-3 text-blue-500 flex-shrink-0" />
                )}
                {user.user_type === 'politician' && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    정치인
                  </Badge>
                )}
              </div>
              {user.full_name && (
                <p className="text-xs text-gray-500 truncate">
                  {user.full_name}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

export function MentionInput({
  value,
  onChange,
  onMentionSelect,
  placeholder = '내용을 입력하세요...',
  disabled = false,
  maxLength,
  rows = 4,
  searchUsers,
  className,
  textareaClassName,
  popoverClassName,
  showFullName = true,
  allowMultiple = true,
  triggerChar = '@',
  minSearchLength = 1
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentionPosition, setMentionPosition] = useState<{ x: number; y: number } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 기본 사용자 검색 함수
  const defaultSearchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        return data.users
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    }
    return []
  }

  const searchFunction = searchUsers || defaultSearchUsers

  // 사용자 검색
  useEffect(() => {
    if (searchQuery.length >= minSearchLength) {
      setIsLoading(true)
      const timer = setTimeout(async () => {
        const results = await searchFunction(searchQuery)
        setUsers(results)
        setSelectedIndex(0)
        setIsLoading(false)
      }, 300) // 디바운싱

      return () => clearTimeout(timer)
    } else {
      setUsers([])
    }
  }, [searchQuery, minSearchLength, searchFunction])

  // 텍스트 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const newCursorPos = e.target.selectionStart

    setValue(newValue)
    setCursorPosition(newCursorPos)

    // 현재 멘션 확인
    const mention = getCurrentMention(newValue, newCursorPos, triggerChar)

    if (mention && mention.query.length >= 0) {
      setSearchQuery(mention.query)
      setShowSuggestions(true)

      // 멘션 팝업 위치 계산
      if (textareaRef.current) {
        const textarea = textareaRef.current
        const textBeforeCursor = newValue.substring(0, mention.start)
        const lines = textBeforeCursor.split('\n')
        const currentLine = lines.length
        const currentColumn = lines[lines.length - 1].length

        // 대략적인 위치 계산 (폰트 크기에 따라 조정 필요)
        const lineHeight = 24
        const charWidth = 8
        const x = currentColumn * charWidth
        const y = currentLine * lineHeight

        setMentionPosition({ x, y })
      }
    } else {
      setShowSuggestions(false)
      setSearchQuery('')
    }

    // 멘션 추출
    const mentions = extractMentions(newValue, triggerChar)
    onChange(newValue, mentions)
  }

  // 내부 상태 설정 함수
  const setValue = (newValue: string) => {
    if (textareaRef.current) {
      textareaRef.current.value = newValue
    }
  }

  // 사용자 선택 핸들러
  const handleUserSelect = (user: User) => {
    if (!textareaRef.current) return

    const mention = getCurrentMention(value, cursorPosition, triggerChar)
    if (!mention) return

    // 멘션 텍스트 교체
    const beforeMention = value.slice(0, mention.start)
    const afterMention = value.slice(mention.end)
    const mentionText = `${triggerChar}${user.username} `
    const newValue = beforeMention + mentionText + afterMention

    setValue(newValue)
    const newCursorPos = mention.start + mentionText.length

    // 커서 위치 설정
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)

    // 멘션 추출 및 콜백
    const mentions = extractMentions(newValue, triggerChar)
    onChange(newValue, mentions)
    onMentionSelect?.(user)

    // 팝업 닫기
    setShowSuggestions(false)
    setSearchQuery('')
  }

  // 키보드 네비게이션
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || users.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
        break
      case 'Enter':
        if (showSuggestions && users[selectedIndex]) {
          e.preventDefault()
          handleUserSelect(users[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // 멘션된 사용자 목록
  const mentionedUsers = useMemo(() => {
    return extractMentions(value, triggerChar)
  }, [value, triggerChar])

  return (
    <div className={cn('relative', className)}>
      {/* 텍스트 영역 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 rounded-md resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            textareaClassName
          )}
        />

        {/* @ 아이콘 인디케이터 */}
        {showSuggestions && (
          <div className="absolute top-2 right-2">
            <AtSign className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* 멘션 제안 팝업 */}
      {showSuggestions && (
        <Card
          ref={suggestionsRef}
          className={cn(
            'absolute z-50 w-64 mt-1 shadow-lg',
            popoverClassName
          )}
          style={
            mentionPosition
              ? {
                  left: `${Math.min(mentionPosition.x, 200)}px`,
                  top: `${mentionPosition.y + 30}px`
                }
              : undefined
          }
        >
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Search className="h-3 w-3" />
              <span>사용자 검색</span>
            </div>
          </div>
          <UserSearchList
            users={users}
            onSelect={handleUserSelect}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
          />
        </Card>
      )}

      {/* 멘션된 사용자 표시 */}
      {mentionedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mentionedUsers.map((username, index) => (
            <Badge
              key={`${username}-${index}`}
              variant="secondary"
              className="text-xs"
            >
              <AtSign className="h-3 w-3 mr-1" />
              {username}
            </Badge>
          ))}
        </div>
      )}

      {/* 글자 수 카운터 */}
      {maxLength && (
        <div className="mt-1 text-right">
          <span
            className={cn(
              'text-xs',
              value.length > maxLength * 0.9
                ? 'text-orange-500'
                : 'text-gray-500'
            )}
          >
            {value.length} / {maxLength}
          </span>
        </div>
      )}
    </div>
  )
}

// 간단한 멘션 인라인 입력 컴포넌트
export function InlineMentionInput({
  value,
  onChange,
  onMentionSelect,
  placeholder = '댓글을 입력하세요...',
  className,
  ...props
}: Omit<MentionInputProps, 'rows'> & { className?: string }) {
  return (
    <MentionInput
      value={value}
      onChange={onChange}
      onMentionSelect={onMentionSelect}
      placeholder={placeholder}
      rows={1}
      className={className}
      textareaClassName="min-h-[40px] py-2"
      {...props}
    />
  )
}