'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenSquare } from 'lucide-react';
;
import { Footer } from '@/components/Footer';
import { getSidebarData } from '@/lib/api/home';
import type { PostsResponse } from '@/types/post';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [sidebarData, setSidebarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 게시글 데이터 로드
        const response = await fetch('/api/posts?limit=20&sort=latest');
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }

        // 사이드바 데이터 로드
        const sidebar = await getSidebarData();
        setSidebarData(sidebar);
      } catch (error) {
        console.error('Failed to load community data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'general', name: '자유게시판' },
    { id: 'question', name: '질문' },
    { id: 'discussion', name: '토론' },
    { id: 'news', name: '뉴스/이슈' },
  ];

  const filteredPosts = posts.filter(post => {
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
    if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <>
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">커뮤니티</h1>
              <p className="text-sm text-gray-600 mt-1">정치인과 정치 이슈에 대해 자유롭게 토론하세요</p>
            </div>
            <Link
              href="/write"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              글쓰기
            </Link>
          </div>

          {/* 공지사항 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-800">
              💡 건전한 토론 문화를 위해 서로를 존중하는 댓글을 작성해주세요. 욕설, 비방, 허위사실 유포 등은 제재 대상이 될 수 있습니다.
            </p>
          </div>
        </div>

        {/* 메인 레이아웃: 3/4 + 1/4 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 메인 콘텐츠 (3/4) */}
          <div className="lg:col-span-3">
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
              {/* 검색바 */}
              <div className="mb-3">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="게시글 검색..."
                    className="flex-1 outline-none text-gray-900 text-sm bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* 카테고리 탭 */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 게시글 목록 */}
            <div className="space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">게시글이 없습니다.</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {post.is_hot && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                              HOT
                            </span>
                          )}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {post.category || '자유게시판'}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-gray-900 mb-2 hover:text-purple-600">
                          {post.title}
                        </h2>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{post.author_username || '익명'}</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                          <span>•</span>
                          <span>👁️ {post.view_count || 0}</span>
                          <span>💬 {post.comment_count || 0}</span>
                          <span>⬆️ {post.upvotes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* 페이지네이션 (추후 구현) */}
            <div className="mt-6 flex justify-center">
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium">
                  1
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  2
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  3
                </button>
              </div>
            </div>
          </div>

          {/* 사이드바 (1/4) */}
          <div className="space-y-3">
            {/* 실시간 통계 */}
            {sidebarData?.realtimeStats && (
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">📊</span>
                  실시간 통계
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">1시간 새 글</span>
                    <span className="font-bold text-purple-600">{sidebarData.realtimeStats.posts_last_hour}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">1시간 댓글</span>
                    <span className="font-bold text-blue-600">{sidebarData.realtimeStats.comments_last_hour}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">24시간 활성 사용자</span>
                    <span className="font-bold text-green-600">{sidebarData.realtimeStats.active_users_24h}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 최근 댓글 */}
            {sidebarData?.recentComments && sidebarData.recentComments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">💬</span>
                  최근 댓글
                </h3>
                <div className="space-y-2 text-xs">
                  {sidebarData.recentComments.slice(0, 5).map((comment: any) => (
                    <div key={comment.id} className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                      <p className="text-gray-700 line-clamp-2 mb-1">{comment.content}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span>{comment.author_username}</span>
                        <span>•</span>
                        <span>{new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 광고 영역 */}
            <div className="bg-gray-100 rounded-lg shadow p-3 border-2 border-dashed border-gray-300">
              <div className="text-center space-y-2">
                <div className="text-gray-400 text-xs font-medium">광고</div>
                <div className="bg-white rounded p-4 min-h-[200px] flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-2">📺</div>
                    <div className="text-xs">광고 영역</div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-400">Sponsored</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
