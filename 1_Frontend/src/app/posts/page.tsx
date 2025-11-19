'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  author_id: string;
  politician_id?: number | null;
  politician_name?: string;
  upvotes: number;
  views: number;
  comment_count: number;
  created_at: string;
}

export default function PostsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/posts');

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          const mappedPosts: Post[] = result.data.map((post: any) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.politicians?.name || '익명',
            author_id: post.user_id,
            politician_id: post.politician_id,
            politician_name: post.politicians?.name,
            upvotes: post.like_count || 0,
            views: post.view_count || 0,
            comment_count: post.comment_count || 0,
            created_at: post.created_at,
          }));

          setPosts(mappedPosts);
        }
      } catch (err) {
        console.error('[게시글 페이지] 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return posts;

    const searchLower = searchTerm.toLowerCase();
    return posts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.author.toLowerCase().includes(searchLower)
    );
  }, [posts, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글</h1>
          <p className="text-lg text-gray-600">다양한 의견을 확인하고 토론에 참여해보세요</p>
        </div>

        {/* Search Section */}
        <section className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="제목, 내용, 작성자로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold">
              검색
            </button>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-gray-500 text-lg mt-4">게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-2">⚠️ {error}</p>
            <p className="text-gray-500 text-sm">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">게시글이 없습니다</p>
          </div>
        ) : (
          /* Post List */
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/community/posts/${post.id}`)}
              >
                <h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 mb-2">
                  {post.title}
                </h3>

                {post.politician_name && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      🏛️ {post.politician_name}
                    </span>
                  </div>
                )}

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.content}</p>

                <div className="flex items-center gap-3 text-xs text-gray-500 border-t pt-3">
                  <span className="font-medium">{post.author}</span>
                  <span>{formatDate(post.created_at)}</span>
                  <span>조회수 {post.views}</span>
                  <span className="text-red-600">👍 {post.upvotes}</span>
                  <span>댓글 {post.comment_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
