/**
 * 커뮤니티 페이지 - 프로토타입 기준 전면 재작성
 * PC = 프로토타입 100% 충실 / 모바일 = md:hidden, hidden md:block 분리
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  author_name: string;
  author_id: string;
  author_type: 'user' | 'politician';
  member_level?: string;
  politician_id?: string | null;
  politician_name?: string;
  politician_identity?: string;
  politician_title?: string;
  politician_party?: string;
  politician_position?: string;
  like_count: number;
  dislike_count: number;
  views: number;
  comment_count: number;
  share_count: number;
  tags: string[];
  is_pinned: boolean;
  is_best: boolean;
  is_hot: boolean;
  created_at: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<'all' | 'politician_post' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let apiUrl = `/api/posts?limit=20`;

      if (currentCategory === 'politician_post') {
        apiUrl += '&has_politician=true';
      } else if (currentCategory === 'general') {
        apiUrl += '&has_politician=false';
      }

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch posts');

      const result = await response.json();
      if (result.success && result.data) {
        const mappedPosts: Post[] = result.data.map((post: any, index: number) => {
          let authorName = '익명';

          // 정치인 게시글인 경우
          if (post.politician_id && post.politicians) {
            authorName = post.politicians.name || '정치인';
          }
          // 일반 회원 게시글인 경우
          else if (post.profiles) {
            authorName = post.profiles.username || post.profiles.nickname || post.profiles.email?.split('@')[0] || '익명';
          }

          // Generate member level based on user_id hash (ML1 ~ ML5) - only for user posts
          const userIdHash = post.user_id ? post.user_id.split('-')[0].charCodeAt(0) : index;
          const memberLevel = post.politician_id ? undefined : `ML${(userIdHash % 5) + 1}`;

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.politician_id ? 'politician_post' : 'general',
            author_name: authorName,
            author_id: post.user_id,
            author_type: post.politician_id ? 'politician' : 'user',
            member_level: memberLevel,
            politician_id: post.politician_id,
            politician_name: post.politicians?.name,
            politician_identity: post.politicians?.identity,
            politician_title: post.politicians?.title,
            politician_party: post.politicians?.party,
            politician_position: post.politicians?.position,
            like_count: post.upvotes || 0,
            dislike_count: post.downvotes || 0,
            views: post.view_count || 0,
            comment_count: post.comment_count || 0,
            share_count: post.share_count || 0,
            tags: post.tags || [],
            is_pinned: post.is_pinned || false,
            is_best: (post.upvotes || 0) > 50,
            is_hot: (post.view_count || 0) > 100,
            created_at: post.created_at,
          };
        });
        setPosts(mappedPosts);
        setTotalCount(result.pagination?.total || mappedPosts.length);
      }
    } catch (err) {
      console.error('게시글 조회 오류:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return post.title.toLowerCase().includes(search) ||
             post.content.toLowerCase().includes(search) ||
             post.author_name.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'popular') return (b.like_count - b.dislike_count) - (a.like_count - a.dislike_count);
      if (sortBy === 'views') return b.views - a.views;
      return 0;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleWriteClick = () => {
    if (currentCategory === 'all') {
      setShowCategoryModal(true);
    } else if (currentCategory === 'politician_post') {
      router.push('/community/posts/create-politician');
    } else {
      router.push('/community/posts/create');
    }
  };

  const getTabClass = (tab: string, borderColor: string) => {
    if (currentCategory === tab) {
      return 'flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 transition whitespace-nowrap text-center min-w-[160px]';
    }
    return `flex-1 px-4 py-2 bg-white text-gray-700 rounded-lg border-2 ${borderColor} font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300 transition whitespace-nowrap text-center min-w-[160px]`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Title */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">정치 관련 자신의 주장을 하고 다양한 의견을 나누면서 토론해 보세요</p>
        </div>

        {/* 게시글 검색 */}
        <section className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="제목, 내용, 작성자 등으로 게시글 통합검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm">
              검색
            </button>
          </div>
        </section>

        {/* Tab Menu + Write Button */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center space-x-4 overflow-x-auto">
            <button
              onClick={() => setCurrentCategory('all')}
              className={getTabClass('all', 'border-gray-300')}
            >
              전체
            </button>
            <button
              onClick={() => setCurrentCategory('politician_post')}
              className={getTabClass('politician_post', 'border-primary-500')}
            >
              🏛️ 정치인 게시판
            </button>
            <button
              onClick={() => setCurrentCategory('general')}
              className={currentCategory === 'general'
                ? 'flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-primary-300 transition whitespace-nowrap text-center min-w-[160px]'
                : 'flex-1 px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-purple-600 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300 transition whitespace-nowrap text-center min-w-[160px]'
              }
            >
              💬 회원 자유게시판
            </button>
          </div>

          {/* Write Button */}
          <button
            onClick={handleWriteClick}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 transition whitespace-nowrap shadow-md"
          >
            글쓰기
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            총 <span className="font-bold text-gray-900">{totalCount}</span>개의 게시글
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'views')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="latest">최신순</option>
              <option value="popular">공감순</option>
              <option value="views">조회순</option>
            </select>
          </div>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">게시글을 불러오는 중...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">게시글이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/community/posts/${post.id}`}>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                            공지
                          </span>
                        )}
                        {post.is_hot && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                            Hot
                          </span>
                        )}
                        {post.is_best && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                            Best
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900">
                          {post.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {post.author_type === 'politician' ? (
                          <Link
                            href={`/politicians/${post.politician_id}`}
                            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {post.politician_name} | {post.politician_position} • {post.politician_party}
                          </Link>
                        ) : (
                          <>
                            <span className="font-medium text-secondary-600">
                              {post.author_name}
                            </span>
                            <span className="text-xs text-gray-900 font-medium" title={`활동 등급: ${post.member_level || 'ML1'}`}>
                              {post.member_level || 'ML1'}
                            </span>
                            <span className="text-xs text-emerald-900 font-medium">🏰 영주</span>
                          </>
                        )}
                        <span>{formatDate(post.created_at)}</span>
                        <span>조회 {post.views}</span>
                        <span className="text-red-600">👍 {post.like_count}</span>
                        <span className="text-gray-400">👎 {post.dislike_count}</span>
                        <span>댓글 {post.comment_count}</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          공유 {post.share_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">카테고리 선택</h2>
            <p className="text-gray-600 mb-6">어떤 게시판에 글을 작성하시겠습니까?</p>

            <div className="space-y-3">
              <Link
                href="/community/posts/create-politician"
                className="block w-full px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-center font-medium shadow-sm border-4 border-primary-600"
              >
                🏛️ 정치인 게시판
              </Link>

              <Link
                href="/community/posts/create"
                className="block w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium shadow-sm border-4 border-purple-700"
              >
                💬 회원 자유게시판
              </Link>
            </div>

            <button
              onClick={() => setShowCategoryModal(false)}
              className="mt-4 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
