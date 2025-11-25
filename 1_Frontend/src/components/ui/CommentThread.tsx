/**
 * Task ID: P5M13
 * 작업명: M13 - 댓글 스레드 컴포넌트
 * 작업일: 2025-11-25
 * 설명: 대댓글 지원 스레드 형식 댓글 컴포넌트
 *       - 무한 중첩 대댓글
 *       - 접기/펼치기 기능
 *       - 모바일 최적화
 *       - 다크모드 지원
 */

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  authorType: 'politician' | 'member';
  authorLevel?: string;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
  parentId?: string;
  isDeleted?: boolean;
}

interface CommentThreadProps {
  /**
   * 댓글 목록
   */
  comments: Comment[];

  /**
   * 댓글 작성 핸들러
   */
  onSubmitComment?: (content: string, parentId?: string) => Promise<void>;

  /**
   * 댓글 삭제 핸들러
   */
  onDeleteComment?: (commentId: string) => Promise<void>;

  /**
   * 추천 핸들러
   */
  onUpvote?: (commentId: string) => void;

  /**
   * 비추천 핸들러
   */
  onDownvote?: (commentId: string) => void;

  /**
   * 현재 사용자 ID
   */
  currentUserId?: string;

  /**
   * 최대 중첩 레벨
   */
  maxDepth?: number;

  /**
   * 로딩 상태
   */
  loading?: boolean;
}

// 상대 시간 포맷
const formatRelativeTime = (timestamp: string): string => {
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
};

// 단일 댓글 아이템 컴포넌트
const CommentItem: React.FC<{
  comment: Comment;
  depth: number;
  maxDepth: number;
  currentUserId?: string;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onUpvote?: (commentId: string) => void;
  onDownvote?: (commentId: string) => void;
}> = ({
  comment,
  depth,
  maxDepth,
  currentUserId,
  onReply,
  onDelete,
  onUpvote,
  onDownvote,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;
  const isOwner = currentUserId === comment.authorId;

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !onReply) return;

    try {
      setSubmitting(true);
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('댓글을 삭제하시겠습니까?')) return;
    await onDelete(comment.id);
  };

  if (comment.isDeleted) {
    return (
      <div className={`py-3 ${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-gray-200 dark:border-slate-700 pl-4' : ''}`}>
        <p className="text-gray-400 dark:text-gray-500 text-sm italic">삭제된 댓글입니다.</p>
        {hasReplies && !isCollapsed && (
          <div className="mt-2">
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`py-3 ${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-gray-200 dark:border-slate-700 pl-4' : ''}`}>
      {/* 댓글 헤더 */}
      <div className="flex items-start gap-3">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {comment.author.charAt(0)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* 작성자 정보 */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link
              href={comment.authorType === 'politician' ? `/politicians/${comment.authorId}` : `/users/${comment.authorId}/profile`}
              className={`font-medium text-sm hover:underline ${
                comment.authorType === 'politician'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {comment.author}
            </Link>
            {comment.authorLevel && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                {comment.authorLevel}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* 댓글 내용 */}
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* 추천 */}
            <button
              onClick={() => onUpvote?.(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>{comment.upvotes}</span>
            </button>

            {/* 비추천 */}
            <button
              onClick={() => onDownvote?.(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              <span>{comment.downvotes}</span>
            </button>

            {/* 답글 */}
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                답글
              </button>
            )}

            {/* 삭제 (본인만) */}
            {isOwner && onDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                삭제
              </button>
            )}

            {/* 접기/펼치기 */}
            {hasReplies && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isCollapsed ? `답글 ${comment.replies!.length}개 보기` : '접기'}
              </button>
            )}
          </div>

          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="w-full p-3 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submitting}
                  className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '등록 중...' : '답글 등록'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 */}
      {hasReplies && !isCollapsed && (
        <div className="mt-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              onUpvote={onUpvote}
              onDownvote={onDownvote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  onSubmitComment,
  onDeleteComment,
  onUpvote,
  onDownvote,
  currentUserId,
  maxDepth = 3,
  loading = false,
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitNewComment = async () => {
    if (!newComment.trim() || !onSubmitComment) return;

    try {
      setSubmitting(true);
      await onSubmitComment(newComment);
      setNewComment('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = useCallback(async (parentId: string, content: string) => {
    if (onSubmitComment) {
      await onSubmitComment(content, parentId);
    }
  }, [onSubmitComment]);

  const totalComments = comments.reduce((count, comment) => {
    const countReplies = (c: Comment): number => {
      return 1 + (c.replies?.reduce((sum, r) => sum + countReplies(r), 0) || 0);
    };
    return count + countReplies(comment);
  }, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          댓글 <span className="text-primary-600 dark:text-primary-400">{totalComments}</span>개
        </h3>
      </div>

      {/* 댓글 작성 */}
      {onSubmitComment && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="w-full p-3 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitNewComment}
              disabled={!newComment.trim() || submitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">댓글을 불러오는 중...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">첫 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="px-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                maxDepth={maxDepth}
                currentUserId={currentUserId}
                onReply={handleReply}
                onDelete={onDeleteComment}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentThread;
