"use client"

import { useState } from 'react'
import { CornerDownRight, ChevronRight, ChevronDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Comment } from '@/types/phase3-database'
import { CommentForm } from './CommentForm'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ReplyThreadProps {
  parentComment: Comment
  replies: Comment[]
  currentUserId?: string
  maxDepth?: number
  currentDepth?: number
  onReplySubmit?: (parentId: number, content: string) => Promise<void>
  onLoadMoreReplies?: (parentId: number) => void
  hasMoreReplies?: boolean
  className?: string
  showReplyForm?: boolean
  compactMode?: boolean
}

// 단일 답글 컴포넌트
function ReplyItem({
  reply,
  isLast = false,
  currentUserId,
  onReply,
  depth = 1
}: {
  reply: Comment
  isLast?: boolean
  currentUserId?: string
  onReply?: (replyId: number) => void
  depth?: number
}) {
  const [showActions, setShowActions] = useState(false)
  const isAuthor = currentUserId === reply.user_id

  return (
    <div
      className={cn(
        'flex gap-3 py-3',
        !isLast && 'border-b border-gray-100 dark:border-gray-800'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 연결선 */}
      <div className="flex flex-col items-center">
        <CornerDownRight className="h-4 w-4 text-gray-400 mt-1" />
        {!isLast && (
          <div className="w-px bg-gray-200 dark:bg-gray-700 flex-1 mt-1" />
        )}
      </div>

      {/* 답글 내용 */}
      <div className="flex-1">
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={reply.author?.avatar_url} alt={reply.author?.username} />
            <AvatarFallback className="text-xs">
              {reply.author?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {reply.author?.username}
              </span>
              {reply.author?.user_type === 'politician' && (
                <Badge variant="secondary" className="text-xs py-0">
                  정치인
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(reply.created_at), {
                  addSuffix: true,
                  locale: ko
                })}
              </span>
              {reply.is_edited && (
                <span className="text-xs text-gray-400">(수정됨)</span>
              )}
            </div>

            {/* 답글 텍스트 */}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {reply.content}
            </p>

            {/* 액션 버튼 */}
            {showActions && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => onReply?.(reply.id)}
                >
                  답글
                </Button>
                {isAuthor && (
                  <>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-red-600">
                      삭제
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 답글 스레드 컴포넌트
export function ReplyThread({
  parentComment,
  replies,
  currentUserId,
  maxDepth = 3,
  currentDepth = 1,
  onReplySubmit,
  onLoadMoreReplies,
  hasMoreReplies = false,
  className,
  showReplyForm: initialShowReplyForm = false,
  compactMode = false
}: ReplyThreadProps) {
  const [isExpanded, setIsExpanded] = useState(!compactMode)
  const [showReplyForm, setShowReplyForm] = useState(initialShowReplyForm)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)

  const canReply = currentDepth < maxDepth
  const replyCount = replies.length

  // 답글 제출 핸들러
  const handleReplySubmit = async (content: string) => {
    if (onReplySubmit) {
      await onReplySubmit(parentComment.id, content)
      setShowReplyForm(false)
    }
  }

  // 컴팩트 모드에서는 축약된 뷰만 표시
  if (compactMode && !isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-xs text-blue-600 hover:text-blue-700 -ml-1"
      >
        <ChevronRight className="h-3 w-3 mr-1" />
        {replyCount}개의 답글 보기
      </Button>
    )
  }

  return (
    <div className={cn('mt-3', className)}>
      {/* 답글 헤더 */}
      {replyCount > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs -ml-1"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                답글 숨기기
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                {replyCount}개의 답글 보기
              </>
            )}
          </Button>

          {isExpanded && canReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              답글 달기
            </Button>
          )}
        </div>
      )}

      {/* 답글 목록 */}
      {isExpanded && replyCount > 0 && (
        <Card className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-l-2 border-blue-500">
          <div className="space-y-1">
            {replies.map((reply, index) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                isLast={index === replies.length - 1}
                currentUserId={currentUserId}
                onReply={canReply ? setReplyingTo : undefined}
                depth={currentDepth}
              />
            ))}

            {/* 더보기 버튼 */}
            {hasMoreReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLoadMoreReplies?.(parentComment.id)}
                className="w-full text-xs mt-2"
              >
                더 많은 답글 보기
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 답글 작성 폼 */}
      {showReplyForm && canReply && (
        <div className="mt-3 ml-8">
          <CommentForm
            postId={0} // ReplyThread에서는 사용하지 않음
            parentId={parentComment.id}
            variant="reply"
            placeholder={`@${parentComment.author?.username || '사용자'}에게 답글 작성...`}
            autoFocus
            showAvatar={false}
            onCancel={() => setShowReplyForm(false)}
            onSubmit={async (data) => {
              await handleReplySubmit(data.content)
            }}
          />
        </div>
      )}

      {/* 특정 답글에 대한 답글 폼 */}
      {replyingTo && (
        <div className="mt-3 ml-12">
          <CommentForm
            postId={0}
            parentId={replyingTo}
            variant="reply"
            placeholder="답글을 입력하세요..."
            autoFocus
            showAvatar={false}
            onCancel={() => setReplyingTo(null)}
            onSubmit={async (data) => {
              if (onReplySubmit) {
                await onReplySubmit(replyingTo, data.content)
              }
              setReplyingTo(null)
            }}
          />
        </div>
      )}

      {/* 답글이 없고 폼도 표시되지 않은 경우 */}
      {replyCount === 0 && !showReplyForm && canReply && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplyForm(true)}
          className="text-xs text-gray-500 -ml-1"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          첫 번째 답글 달기
        </Button>
      )}
    </div>
  )
}

// 답글 카운트 표시 컴포넌트
export function ReplyCount({
  count,
  onClick,
  className
}: {
  count: number
  onClick?: () => void
  className?: string
}) {
  if (count === 0) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('text-xs text-gray-500 hover:text-gray-700', className)}
    >
      <CornerDownRight className="h-3 w-3 mr-1" />
      {count}개의 답글
    </Button>
  )
}

// 답글 인디케이터 컴포넌트
export function ReplyIndicator({
  depth,
  maxDepth = 3
}: {
  depth: number
  maxDepth?: number
}) {
  const indicators = []
  for (let i = 0; i < Math.min(depth, maxDepth); i++) {
    indicators.push(
      <div
        key={i}
        className="w-px h-full bg-gray-200 dark:bg-gray-700"
        style={{ marginLeft: `${i * 12}px` }}
      />
    )
  }

  return (
    <div className="flex gap-2 mr-3">
      {indicators}
    </div>
  )
}