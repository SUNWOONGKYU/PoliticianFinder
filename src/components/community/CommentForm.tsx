"use client"

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, X, AtSign, Smile, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CreateCommentDto } from '@/types/phase3-database'
import { toast } from '@/components/ui/use-toast'

interface CommentFormProps {
  postId: number
  parentId?: number
  onSubmit?: (comment: CreateCommentDto) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
  showAvatar?: boolean
  currentUser?: {
    id: string
    username: string
    avatar_url?: string
  }
  maxLength?: number
  minLength?: number
  className?: string
  variant?: 'default' | 'reply' | 'minimal'
}

export function CommentForm({
  postId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = '댓글을 입력하세요...',
  autoFocus = false,
  showAvatar = true,
  currentUser,
  maxLength = 1000,
  minLength = 1,
  className,
  variant = 'default'
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 댓글 글자 수 계산
  const charCount = content.length
  const isValidLength = charCount >= minLength && charCount <= maxLength

  // 멘션 추출 (@username 패턴)
  const extractMentions = (text: string): string[] => {
    const mentionPattern = /@(\w+)/g
    const matches = text.match(mentionPattern)
    return matches ? matches.map(m => m.slice(1)) : []
  }

  // 댓글 제출 처리
  const handleSubmit = async () => {
    if (!content.trim() || !isValidLength || isSubmitting) return

    setIsSubmitting(true)
    try {
      const mentions = extractMentions(content)
      const commentData: CreateCommentDto = {
        post_id: postId,
        content: content.trim(),
        parent_id: parentId,
        mentioned_users: mentions
      }

      if (onSubmit) {
        await onSubmit(commentData)
        setContent('')
        setMentionedUsers([])
        toast({
          title: "댓글 작성 완료",
          description: "댓글이 성공적으로 작성되었습니다."
        })
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      toast({
        title: "댓글 작성 실패",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 키보드 단축키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter로 제출
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    // Escape로 취소
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault()
      onCancel()
    }
  }

  // Variant별 스타일
  const variantStyles = {
    default: 'p-4 border rounded-lg',
    reply: 'p-3 bg-gray-50 dark:bg-gray-900 rounded-lg ml-12',
    minimal: 'p-2'
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <div className="space-y-3">
        {/* 사용자 아바타와 입력 영역 */}
        <div className="flex gap-3">
          {showAvatar && currentUser && (
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
              <AvatarFallback>{currentUser.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 space-y-2">
            {/* 답글 표시 */}
            {parentId && variant === 'reply' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary" className="text-xs">답글</Badge>
                <span>작성 중...</span>
              </div>
            )}

            {/* 텍스트 입력 영역 */}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              autoFocus={autoFocus}
              disabled={isSubmitting}
              className={cn(
                'min-h-[100px] resize-none transition-all',
                isFocused && 'ring-2 ring-blue-500',
                !isValidLength && charCount > 0 && 'border-red-500'
              )}
              maxLength={maxLength}
              aria-label="댓글 내용"
              aria-describedby="char-count"
            />

            {/* 글자 수 카운터 */}
            <div className="flex items-center justify-between text-sm">
              <span
                id="char-count"
                className={cn(
                  'text-gray-500',
                  charCount > maxLength * 0.9 && 'text-orange-500',
                  !isValidLength && 'text-red-500'
                )}
              >
                {charCount} / {maxLength}
              </span>

              {/* 단축키 힌트 */}
              {isFocused && (
                <span className="text-xs text-gray-400">
                  Ctrl+Enter로 제출 • Esc로 취소
                </span>
              )}
            </div>

            {/* 멘션된 사용자 표시 */}
            {mentionedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {mentionedUsers.map((user) => (
                  <Badge key={user} variant="outline" className="text-xs">
                    @{user}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between">
          {/* 도구 버튼들 */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSubmitting}
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>사용자 멘션</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSubmitting}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>이모지</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSubmitting}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>파일 첨부</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 제출/취소 버튼 */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || !isValidLength || isSubmitting}
              size="sm"
              className="min-w-[80px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  댓글 작성
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}