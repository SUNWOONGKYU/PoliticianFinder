"use client"

import { useState, useMemo } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, MoreVertical, Flag, Edit, Trash, Reply } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Comment, CommentTree, CommentStatus } from '@/types/phase3-database'
import { CommentForm } from './CommentForm'
import { LikeButton } from './LikeButton'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CommentListProps {
  postId: number
  comments: Comment[]
  currentUserId?: string
  isLoading?: boolean
  onReply?: (parentId: number) => void
  onEdit?: (commentId: number) => void
  onDelete?: (commentId: number) => void
  onReport?: (commentId: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  maxDepth?: number
  className?: string
}

// 댓글을 계층 구조로 변환
function buildCommentTree(comments: Comment[]): CommentTree[] {
  const commentMap = new Map<number, CommentTree>()
  const rootComments: CommentTree[] = []

  // 모든 댓글을 맵에 저장
  comments.forEach(comment => {
    commentMap.set(comment.id, {
      ...comment,
      children: [],
      children_count: 0
    } as CommentTree)
  })

  // 부모-자식 관계 설정
  comments.forEach(comment => {
    const treeComment = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.children.push(treeComment)
        parent.children_count++
      }
    } else {
      rootComments.push(treeComment)
    }
  })

  // 최신 댓글이 위로 오도록 정렬
  const sortComments = (comments: CommentTree[]) => {
    comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    comments.forEach(comment => {
      if (comment.children.length > 0) {
        sortComments(comment.children)
      }
    })
  }

  sortComments(rootComments)
  return rootComments
}

// 단일 댓글 컴포넌트
function CommentItem({
  comment,
  currentUserId,
  depth = 0,
  maxDepth = 3,
  onReply,
  onEdit,
  onDelete,
  onReport,
  postId
}: {
  comment: CommentTree
  currentUserId?: string
  depth?: number
  maxDepth?: number
  onReply?: (parentId: number) => void
  onEdit?: (commentId: number) => void
  onDelete?: (commentId: number) => void
  onReport?: (commentId: number) => void
  postId: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAuthor = currentUserId === comment.user_id
  const canReply = depth < maxDepth
  const hasChildren = comment.children.length > 0

  // 삭제된 댓글 처리
  if (comment.is_deleted) {
    return (
      <div className={cn('opacity-50', depth > 0 && 'ml-12')}>
        <Card className="p-4 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-500 italic">삭제된 댓글입니다.</p>
          {hasChildren && (
            <div className="mt-4 space-y-3">
              {comment.children.map(child => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                  postId={postId}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-12')}>
      <Card className={cn(
        'p-4 transition-all',
        comment.status === CommentStatus.REPORTED && 'border-orange-500',
        comment.is_edited && 'border-l-4 border-l-blue-500'
      )}>
        {/* 댓글 헤더 */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar_url} alt={comment.author?.username} />
            <AvatarFallback>{comment.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            {/* 작성자 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author?.username}</span>
                {comment.author?.user_type === 'politician' && (
                  <Badge variant="secondary" className="text-xs">정치인</Badge>
                )}
                {comment.is_edited && (
                  <Badge variant="outline" className="text-xs">수정됨</Badge>
                )}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ko
                  })}
                </span>
              </div>

              {/* 더보기 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(comment.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600"
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onReport?.(comment.id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    신고
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 댓글 내용 */}
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </div>

            {/* 멘션된 사용자 표시 */}
            {comment.mentioned_users && comment.mentioned_users.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comment.mentioned_users.map((userId) => (
                  <Badge key={userId} variant="outline" className="text-xs">
                    @사용자
                  </Badge>
                ))}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-2 mt-3">
              <LikeButton
                targetId={comment.id}
                targetType="comment"
                initialCount={comment.score}
                size="sm"
              />

              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  답글
                </Button>
              )}

              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      답글 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      답글 {comment.children_count}개 보기
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 답글 작성 폼 */}
        {showReplyForm && (
          <div className="mt-4 ml-12">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              variant="reply"
              placeholder="답글을 입력하세요..."
              autoFocus
              onCancel={() => setShowReplyForm(false)}
              onSubmit={async (data) => {
                onReply?.(comment.id)
                setShowReplyForm(false)
              }}
            />
          </div>
        )}
      </Card>

      {/* 하위 댓글들 */}
      {isExpanded && hasChildren && (
        <div className="space-y-3">
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              currentUserId={currentUserId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 댓글 목록 로딩 스켈레톤
function CommentListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function CommentList({
  postId,
  comments,
  currentUserId,
  isLoading = false,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onLoadMore,
  hasMore = false,
  maxDepth = 3,
  className
}: CommentListProps) {
  // 댓글을 계층 구조로 변환
  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  if (isLoading) {
    return <CommentListSkeleton />
  }

  if (comments.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">아직 댓글이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-1">첫 번째 댓글을 작성해보세요!</p>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 댓글 개수 표시 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 {comments.length}개
        </h3>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {commentTree.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            depth={0}
            maxDepth={maxDepth}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReport={onReport}
            postId={postId}
          />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="w-full sm:w-auto"
          >
            더 많은 댓글 보기
          </Button>
        </div>
      )}
    </div>
  )
}