/**
 * Skeleton UI 컴포넌트
 * 로딩 중 콘텐츠 플레이스홀더를 표시하여 체감 로딩 속도 개선
 * Created: 2025-12-13
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

// 기본 Skeleton 컴포넌트
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
}

// 텍스트 라인 Skeleton
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// 카드 Skeleton
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// 정치인 카드 Skeleton
export function SkeletonPoliticianCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

// 테이블 행 Skeleton
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// 테이블 Skeleton
export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 게시글 목록 Skeleton
export function SkeletonPostList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b pb-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 메인 페이지 랭킹 테이블 Skeleton
export function SkeletonRankingTable({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {['순위', '이름', '현 직책', '정당', '신분', '출마직종', '지역', '지구', '등급', '종합', 'Claude', 'GPT', 'Grok', '회원평가'].map((_, i) => (
              <th key={i} className="px-2 py-3">
                <Skeleton className="h-4 w-12 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="animate-pulse">
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-12" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-12" /></td>
              <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
              <td className="px-2 py-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 프로필 페이지 Skeleton
export function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <SkeletonText lines={5} />
      </div>
    </div>
  );
}
