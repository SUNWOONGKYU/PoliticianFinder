'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import PostCard from './PostCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post, PostsResponse } from '@/types/post';

interface PostListProps {
  initialData?: PostsResponse;
  politicianId?: number;
  showPolitician?: boolean;
}

export default function PostList({
  initialData,
  politicianId,
  showPolitician = true
}: PostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>(initialData?.data || []);
  const [loading, setLoading] = useState(!initialData);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터에서 현재 상태 읽기
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentCategory = searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentSearch = searchParams.get('search') || '';

  const limit = 20;

  // 카테고리 탭
  const categories = [
    { value: 'all', label: '전체' },
    { value: 'general', label: '자유' },
    { value: 'politics', label: '정치' },
    { value: 'question', label: '질문' },
    { value: 'review', label: '평가' },
  ];

  // 정렬 옵션
  const sortOptions = [
    { value: 'latest', label: '최신순' },
    { value: 'popular', label: '인기순' },
    { value: 'views', label: '조회순' },
    { value: 'likes', label: '추천순' },
  ];

  // 게시글 로드
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', limit.toString());
      params.set('sort', currentSort);

      if (currentCategory !== 'all') {
        params.set('category', currentCategory);
      }

      if (politicianId) {
        params.set('politician_id', politicianId.toString());
      }

      if (currentSearch) {
        params.set('search', currentSearch);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data: PostsResponse = await response.json();
      setPosts(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentCategory, currentSort, currentSearch, politicianId]);

  // URL 변경 시 데이터 다시 로드
  useEffect(() => {
    if (!initialData || searchParams.toString()) {
      fetchPosts();
    }
  }, [fetchPosts, searchParams]);

  // URL 파라미터 업데이트 헬퍼
  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // 페이지가 아닌 다른 파라미터가 변경되면 페이지를 1로 리셋
    if (!('page' in updates) && params.get('page') !== '1') {
      params.set('page', '1');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && !posts.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 탭 */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateSearchParams({ category: cat.value === 'all' ? '' : cat.value })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              (cat.value === 'all' && !currentCategory) || currentCategory === cat.value
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 정렬 옵션 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          총 <span className="font-medium">{total}</span>개의 게시글
        </div>
        <select
          value={currentSort}
          onChange={(e) => updateSearchParams({ sort: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showPolitician={showPolitician}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => updateSearchParams({ page: (currentPage - 1).toString() })}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 10) {
                pageNum = i + 1;
              } else if (currentPage <= 6) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i;
              } else {
                pageNum = currentPage - 5 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => updateSearchParams({ page: pageNum.toString() })}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => updateSearchParams({ page: (currentPage + 1).toString() })}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}