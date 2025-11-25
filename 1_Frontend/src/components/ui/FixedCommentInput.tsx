/**
 * Project Grid Task ID: MI7
 * 작업명: 댓글 입력 고정 구현
 * 생성시간: 2025-11-25
 * 생성자: Claude Code
 * 설명: 모바일에서 하단에 고정되는 댓글 입력창 컴포넌트
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface FixedCommentInputProps {
  /** 댓글 제출 핸들러 */
  onSubmit: (content: string) => Promise<void>;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 제출 버튼 텍스트 */
  submitText?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로그인 필요 여부 */
  requireAuth?: boolean;
  /** 로그인 버튼 클릭 핸들러 */
  onLoginClick?: () => void;
  /** 모바일에서만 고정 여부 */
  mobileOnly?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

export default function FixedCommentInput({
  onSubmit,
  placeholder = '댓글을 입력하세요...',
  submitText = '등록',
  disabled = false,
  requireAuth = false,
  onLoginClick,
  mobileOnly = true,
  className = ''
}: FixedCommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트영역 높이 자동 조절
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 내용 변경 시 높이 조절
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // 댓글 제출
  const handleSubmit = useCallback(async () => {
    if (!content.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Comment submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, disabled, isSubmitting, onSubmit]);

  // Enter 키로 제출 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // 로그인 필요한 경우
  if (requireAuth) {
    return (
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-40
          bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
          px-4 py-3 shadow-lg
          ${mobileOnly ? 'md:relative md:border-t-0 md:shadow-none md:mt-4' : ''}
          ${className}
        `}
      >
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onLoginClick}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-touch"
          >
            로그인하고 댓글 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
        px-4 py-2 shadow-lg
        ${mobileOnly ? 'md:relative md:border-t-0 md:shadow-none md:mt-4 md:p-0' : ''}
        ${isFocused ? 'pb-safe-area-inset-bottom' : ''}
        ${className}
      `}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2">
          {/* 텍스트 입력 영역 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              rows={1}
              className={`
                w-full px-4 py-3
                bg-gray-100 dark:bg-gray-700
                border border-gray-200 dark:border-gray-600
                rounded-2xl
                text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                resize-none overflow-hidden
                min-h-[44px] max-h-[120px]
                transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{ height: 'auto' }}
            />
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || disabled || isSubmitting}
            className={`
              flex-shrink-0
              px-4 py-3
              rounded-full
              font-medium
              min-h-touch min-w-touch
              transition-all duration-200
              ${
                content.trim() && !disabled && !isSubmitting
                  ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
            aria-label={submitText}
          >
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin\" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* 글자 수 표시 (선택 사항) */}
        {content.length > 0 && (
          <div className="text-right mt-1 pr-16">
            <span className={`text-xs ${content.length > 500 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {content.length}/500
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 사용 예시:
 *
 * const handleCommentSubmit = async (content: string) => {
 *   await postComment(content);
 *   refreshComments();
 * };
 *
 * <FixedCommentInput
 *   onSubmit={handleCommentSubmit}
 *   placeholder="의견을 남겨주세요..."
 *   requireAuth={!isLoggedIn}
 *   onLoginClick={() => router.push('/auth/login')}
 * />
 */
