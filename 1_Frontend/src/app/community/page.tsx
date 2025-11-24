'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingPage } from '@/components/ui/Spinner';

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: 'all' | 'politician_post' | 'general';
  author: string;
  author_id: string;
  author_type: 'user' | 'politician';
  politician_id?: number | null;
  politician_tag?: string;
  politician_status?: string;
  politician_position?: string;
  member_level?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  views: number;
  comment_count: number;
  tags: string[];
  is_pinned: boolean;
  is_best: boolean;
  is_hot: boolean;
  created_at: string;
  share_count?: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<'all' | 'politician_post' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sample user nicknames
  const sampleNicknames = [
    '정치는우리의것', '투명한정치', '민주시민', '시민참여자', '투표하는시민',
    '민생이우선', '변화를원해', '미래세대', '깨어있는시민', '정책분석가'
  ];

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build API URL with filters
        let apiUrl = `/api/community/posts?page=${currentPage}&limit=20`;

        // Add category filter if not 'all'
        if (currentCategory === 'politician_post') {
          apiUrl += '&has_politician=true';
        } else if (currentCategory === 'general') {
          apiUrl += '&has_politician=false';
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to CommunityPost interface
          const mappedPosts: CommunityPost[] = result.data.map((post: any, index: number) => {
            // Generate consistent nickname based on user_id
            const userIdHash = post.user_id ? post.user_id.split('-')[0].charCodeAt(0) : index;
            const nicknameIndex = userIdHash % 10;

            // Generate consistent member level (ML1-ML5) based on user_id
            const mlLevel = post.politician_id ? undefined : `ML${(userIdHash % 5) + 1}`;

            return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.politician_id ? 'politician_post' : 'general',
            author: post.politician_id && post.politicians ? post.politicians.name : sampleNicknames[nicknameIndex],
            author_id: post.user_id,
            author_type: post.politician_id ? 'politician' as const : 'user' as const,
            politician_id: post.politician_id,
            politician_tag: post.politicians?.name,
            politician_status: post.politicians?.status,
            politician_position: post.politicians?.position,
            member_level: mlLevel,
            upvotes: post.upvotes || 0,
            downvotes: post.downvotes || 0,
            score: (post.upvotes || 0) - (post.downvotes || 0),
            views: post.view_count || 0,
            comment_count: post.comment_count || 0,
            tags: post.tags || [],
            is_pinned: post.is_pinned || false,
            is_best: false,
            is_hot: (post.view_count || 0) > 100,
            created_at: post.created_at,
            share_count: post.share_count || 0,
          };
          });

          setPosts(mappedPosts);

          // Set total pages and count from pagination
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages);
            setTotalCount(result.pagination.total);
          }
        }
      } catch (err) {
        console.error('[커뮤니티 페이지] 게시글 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, currentCategory]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let postsToFilter = posts;

    // Filter by search term (category filtering is done by API)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      postsToFilter = postsToFilter.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower)
      );
    }

    // Sort posts
    const sorted = [...postsToFilter];
    if (sortBy === 'latest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'views') {
      sorted.sort((a, b) => b.views - a.views);
    }

    return sorted;
  }, [posts, searchTerm, currentCategory, sortBy]);

  const handleFollow = (userId: string) => {
    const newFollowed = new Set(followedUsers);
    if (newFollowed.has(userId)) {
      newFollowed.delete(userId);
    } else {
      newFollowed.add(userId);
    }
    setFollowedUsers(newFollowed);
  };

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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">정치 관련 자신의 주장을 하고 다양한 의견을 나누면서 토론해 보세요</p>
        </div>

        {/* Search Section */}
        <section className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                inputMode="search"
                placeholder="게시글 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200 text-base"
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
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <button
              onClick={() => setCurrentCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'all'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-gray-700 border-2 border-primary-500 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setCurrentCategory('politician_post')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'politician_post'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-gray-700 border-2 border-primary-500 hover:bg-gray-100'
              }`}
            >
              🏛️ 정치인 게시판
            </button>
            <button
              onClick={() => setCurrentCategory('general')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'general'
                  ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                  : 'bg-white text-gray-700 border-2 border-secondary-500 hover:bg-gray-100'
              }`}
            >
              💬 회원 자유게시판
            </button>
          </div>

          <button
            onClick={() => {
              if (currentCategory === 'all') {
                // 전체 탭: 정치인/회원 선택 모달
                setShowCategoryModal(true);
              } else if (currentCategory === 'politician_post') {
                // 정치인 게시판: 바로 정치인 글쓰기로
                router.push('/community/posts/create-politician');
              } else {
                // 자유게시판: 바로 회원 글쓰기로
                router.push('/community/posts/create');
              }
            }}
            className={`px-6 py-2 text-white rounded-lg font-medium hover:bg-opacity-90 transition whitespace-nowrap shadow-md ${
              currentCategory === 'general' ? 'bg-secondary-500' : 'bg-primary-500'
            }`}
          >
            글쓰기
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            총 <span className="font-bold text-gray-900">{totalCount}</span>개의 게시글
            {totalPages > 1 && <span className="ml-2 text-gray-500">({currentPage}/{totalPages} 페이지)</span>}
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

        {/* Loading State */}
        {loading ? (
          <LoadingPage message="게시글을 불러오는 중..." />
        ) : error ? (
          /* Error State */
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-2">⚠️ {error}</p>
            <p className="text-gray-500 text-sm">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State - Enhanced for mobile UX */
          <div className="text-center py-16 px-4">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentCategory === 'all' ? '게시글이 없습니다' :
               currentCategory === 'politician_post' ? '정치인이 작성한 게시글이 없습니다' :
               '회원이 작성한 게시글이 없습니다'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">첫 게시글을 작성해보세요!</p>
            <button
              onClick={() => {
                if (currentCategory === 'all') {
                  setShowCategoryModal(true);
                } else if (currentCategory === 'politician_post') {
                  router.push('/community/posts/create-politician');
                } else {
                  router.push('/community/posts/create');
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg transition min-h-touch"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              글쓰기
            </button>
          </div>
        ) : (
          /* Post List - Redesigned */
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden touch-manipulation">
                {/* Header: Author Info */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Author Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          {post.author_type === 'politician' ? (
                            <Link
                              href={`/politicians/${post.politician_id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.author}
                            </Link>
                          ) : (
                            <Link
                              href={`/users/${post.author_id}/profile`}
                              className="font-semibold text-gray-900 hover:text-secondary-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.author}
                            </Link>
                          )}
                          {post.member_level && (
                            <span className="text-xs text-emerald-700 font-medium">🏰 {post.member_level}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(post.created_at)}</div>
                      </div>
                    </div>

                    {/* Follow Button (회원 글만) */}
                    {post.author_type === 'user' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFollow(post.author_id);
                        }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                          followedUsers.has(post.author_id)
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        {followedUsers.has(post.author_id) ? '팔로잉' : '팔로우'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Body: Content - Clickable Area */}
                <div
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => router.push(`/community/posts/${post.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/community/posts/${post.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${post.title} 게시글 보기`}
                >
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {post.is_hot && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">🔥 Hot</span>
                    )}
                    {post.is_best && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">⭐ Best</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Politician Tag */}
                  {post.politician_tag && post.author_type === 'user' && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                        🏷️ {post.politician_tag}
                      </span>
                    </div>
                  )}

                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer: Interaction Stats */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-6">
                    <button
                      className="flex items-center gap-1.5 hover:text-primary-600 transition min-h-touch px-2"
                      aria-label={`공감 ${post.upvotes}개`}
                    >
                      <span className="text-base">👍</span>
                      <span className="font-medium">{post.upvotes}</span>
                    </button>

                    <button
                      className="flex items-center gap-1.5 hover:text-gray-500 transition min-h-touch px-2"
                      aria-label={`비공감 ${post.downvotes}개`}
                    >
                      <span className="text-base">👎</span>
                      <span className="font-medium">{post.downvotes}</span>
                    </button>

                    <button
                      className="flex items-center gap-1.5 hover:text-secondary-600 transition min-h-touch px-2"
                      aria-label={`댓글 ${post.comment_count}개`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{post.comment_count}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span>조회 {post.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination - 하단 */}
        {!loading && !error && filteredPosts.length > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              이전
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === pageNum
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage >= totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Writing */}
      <button
        onClick={() => {
          if (currentCategory === 'all') {
            setShowCategoryModal(true);
          } else if (currentCategory === 'politician_post') {
            router.push('/community/posts/create-politician');
          } else {
            router.push('/community/posts/create');
          }
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="글쓰기"
        aria-label="글쓰기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">카테고리 선택</h2>
            <p className="text-gray-600 mb-6">어떤 게시판에 글을 작성하시겠습니까?</p>

            <div className="space-y-3">
              <Link href="/community/posts/create-politician" className="block w-full px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-center font-medium shadow-sm border-4 border-primary-600">
                🏛️ 정치인 게시판
              </Link>
              <Link href="/community/posts/create" className="block w-full px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition text-center font-medium shadow-sm border-4 border-secondary-700">
                💬 회원 자유게시판
              </Link>
            </div>

            <button
              onClick={() => setShowCategoryModal(false)}
              className="mt-4 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium min-h-touch"
              aria-label="카테고리 선택 취소"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
