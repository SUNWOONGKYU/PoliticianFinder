'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getInfluenceGrade, formatInfluenceGrade } from '@/utils/memberLevel';
import GradeUpgradeModal from '@/components/GradeUpgradeModal';
import useGradeNotification from '@/hooks/useGradeNotification';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type TabType = 'posts' | 'comments' | 'activity';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  level: number;
  profile_image_url: string | null;
  preferred_district: string | null;
}

interface UserComment {
  id: number;
  content: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  post_id: number;
  post_title: string;
}

interface UserStats {
  follower_count: number;
  following_count: number;
  post_count: number;
  comment_count: number;
  activity_level: string;
  influence_grade: string;
}

interface UserPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  view_count: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  share_count: number;
}


export default function MypagePage() {
  // P7F1: 페이지 레벨 인증 보호
  const { user: authUser, loading: authLoading } = useRequireAuth();

  // 모든 useState는 조건문 이전에 호출 (React Hook 규칙)
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 등급 변동 알림 훅
  const { notification, closeModal } = useGradeNotification({
    activityLevel: userStats?.activity_level,
    influenceGrade: userStats?.influence_grade,
    isLoggedIn: !!userData,
  });

  // 모든 useEffect는 조건문 이전에 호출 (React Hook 규칙)
  useEffect(() => {
    // authLoading 중이면 fetch 하지 않음
    if (authLoading) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || '사용자 정보를 불러오는데 실패했습니다.');
        }

        // /api/auth/me 응답: { success, user, profile }
        const user = result.user;
        const profile = result.profile;

        setUserData({
          id: user.id,
          email: user.email,
          name: profile?.name || profile?.nickname || user.email,
          role: profile?.role || 'user',
          points: profile?.activity_points || 0,
          level: parseInt((profile?.activity_level || 'ML1').replace('ML', '')) || 1,
          profile_image_url: profile?.profile_image_url || null,
          preferred_district: profile?.preferred_district || null,
        });

        // 사용자 통계 불러오기
        const userId = user.id;
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        const statsResult = await statsResponse.json();

        if (statsResponse.ok && statsResult.success) {
          const calculatedLevel = statsResult.data.activity?.level || 'ML1';
          const calculatedLevelNum = parseInt(calculatedLevel.replace('ML', '')) || 1;

          setUserStats({
            follower_count: statsResult.data.followers?.count || 0,
            following_count: statsResult.data.followers?.following_count || 0,
            post_count: statsResult.data.activity_stats?.post_count || 0,
            comment_count: statsResult.data.activity_stats?.comment_count || 0,
            activity_level: calculatedLevel,
            influence_grade: statsResult.data.influence?.grade || 'Wanderer',
          });

          // 포인트 기반 계산된 레벨로 userData 업데이트
          setUserData(prev => prev ? {
            ...prev,
            level: calculatedLevelNum,
            points: statsResult.data.activity?.points || prev.points,
          } : null);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch user data:', err);
        }
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authLoading]);

  // Fetch user posts when userData is available and posts tab is active
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userData || activeTab !== 'posts') return;

      try {
        setPostsLoading(true);
        const response = await fetch(`/api/community/posts?user_id=${userData.id}&limit=10`);
        const result = await response.json();

        if (result.success && result.data) {
          setUserPosts(result.data);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch user posts:', err);
        }
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [userData, activeTab]);

  // Fetch user comments when comments tab is active
  useEffect(() => {
    const fetchUserComments = async () => {
      if (!userData || activeTab !== 'comments') return;

      try {
        setCommentsLoading(true);
        const response = await fetch(`/api/community/comments?user_id=${userData.id}&limit=10`);
        const result = await response.json();

        if (result.success && result.data) {
          setUserComments(result.data);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch user comments:', err);
        }
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchUserComments();
  }, [userData, activeTab]);

  // P7F1: 인증 로딩 중일 때 로딩 표시 (모든 Hook 호출 후 early return)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Error state - 비로그인 상태 안내
  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 overflow-x-hidden">
        <div className="text-center max-w-md">
          <div className="text-primary-500 dark:text-primary-400 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">로그인이 필요합니다</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            마이페이지를 이용하려면 로그인해주세요.
            <br />
            <span className="text-sm">회원가입 후 다양한 기능을 이용할 수 있습니다.</span>
          </p>

          {/* 주요 버튼 */}
          <div className="space-y-3 mb-8">
            <Link
              href="/auth/login"
              className="block w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition min-h-[48px] flex items-center justify-center"
            >
              로그인 페이지로 이동
            </Link>
            <Link
              href="/auth/signup"
              className="block w-full px-6 py-3 border-2 border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 font-medium transition min-h-[48px] flex items-center justify-center"
            >
              회원가입
            </Link>
          </div>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">또는</span>
            </div>
          </div>

          {/* 다른 페이지로 이동 */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">로그인 없이 둘러보기</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈
            </Link>
            <Link
              href="/politicians"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              정치인
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              커뮤니티
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Sidebar: Profile Card - 모바일 최적화 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-20">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4 overflow-hidden bg-secondary-500">
                  {userData.profile_image_url ? (
                    <Image
                      src={userData.profile_image_url}
                      alt="프로필"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{userData.email}</p>
                <span className="inline-block bg-secondary-100 text-secondary-700 text-xs font-semibold px-3 py-1 rounded-full mt-2">ML{userData.level}</span>
              </div>

              {/* Stats - 모바일: 3열, 태블릿 이상: 5열 */}
              <div className="mt-6 pt-6 border-t grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 text-center">
                <div className="p-2">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{userStats?.post_count || 0}</div>
                  <div className="text-xs text-gray-500">게시글</div>
                </div>
                <div className="p-2">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{userStats?.comment_count || 0}</div>
                  <div className="text-xs text-gray-500">댓글</div>
                </div>
                <div className="p-2">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{userData.points.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">포인트</div>
                </div>
                <Link
                  href={`/users/${userData.id}/followers`}
                  className="hover:bg-gray-50 active:bg-gray-100 rounded-lg p-2 min-h-[44px] transition cursor-pointer touch-manipulation flex flex-col items-center justify-center"
                >
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{userStats?.follower_count || 0}</div>
                  <div className="text-xs text-gray-500">팔로워</div>
                </Link>
                <Link
                  href={`/users/${userData.id}/following`}
                  className="hover:bg-gray-50 active:bg-gray-100 rounded-lg p-2 min-h-[44px] transition cursor-pointer touch-manipulation flex flex-col items-center justify-center"
                >
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{userStats?.following_count || 0}</div>
                  <div className="text-xs text-gray-500">팔로잉</div>
                </Link>
              </div>

              {/* Actions - 모바일 최적화 */}
              <div className="mt-6 space-y-3">
                <Link
                  href="/profile/edit"
                  className="block w-full text-center min-h-[44px] px-4 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 active:bg-secondary-700 font-medium text-base focus:outline-none focus:ring-2 focus:ring-secondary-300 transition touch-manipulation flex items-center justify-center"
                >
                  프로필 수정
                </Link>
                <Link
                  href="/settings"
                  className="block w-full text-center min-h-[44px] px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium text-base focus:outline-none focus:ring-2 focus:ring-gray-300 transition touch-manipulation flex items-center justify-center"
                >
                  설정
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content: Tabs */}
          <div className="lg:col-span-2">
            {/* Tab Navigation - 모바일 최적화 */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav role="tablist" aria-label="마이페이지 섹션" className="flex -mb-px overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <button
                    role="tab"
                    id="tab-posts"
                    aria-selected={activeTab === 'posts'}
                    aria-controls="panel-posts"
                    onClick={() => setActiveTab('posts')}
                    className={`flex-shrink-0 min-h-[44px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none touch-manipulation whitespace-nowrap ${
                      activeTab === 'posts'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    내 게시글
                  </button>
                  <button
                    role="tab"
                    id="tab-comments"
                    aria-selected={activeTab === 'comments'}
                    aria-controls="panel-comments"
                    onClick={() => setActiveTab('comments')}
                    className={`flex-shrink-0 min-h-[44px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none touch-manipulation whitespace-nowrap ${
                      activeTab === 'comments'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    내 댓글
                  </button>
                  <button
                    role="tab"
                    id="tab-activity"
                    aria-selected={activeTab === 'activity'}
                    aria-controls="panel-activity"
                    onClick={() => setActiveTab('activity')}
                    className={`flex-shrink-0 min-h-[44px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none touch-manipulation whitespace-nowrap ${
                      activeTab === 'activity'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    활동 내역
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content: Posts */}
            {activeTab === 'posts' && (
              <div id="panel-posts" role="tabpanel" aria-labelledby="tab-posts">
                {postsLoading ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">작성한 게시글이 없습니다.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md divide-y">
                    {userPosts.map((post) => (
                      <Link key={post.id} href={`/community/posts/${post.id}`}>
                        <div className="p-4 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer touch-manipulation">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 hover:text-secondary-600">
                                {post.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                                <span>조회수 {post.view_count || 0}</span>
                                <span className="text-red-600">👍 {post.upvotes || 0}</span>
                                <span>댓글 {post.comment_count || 0}</span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                  <span>공유 {post.share_count || 0}</span>
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
            )}

            {/* Tab Content: Comments */}
            {activeTab === 'comments' && (
              <div id="panel-comments" role="tabpanel" aria-labelledby="tab-comments">
                {commentsLoading ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">댓글을 불러오는 중...</p>
                  </div>
                ) : userComments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600">작성한 댓글이 없습니다.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md divide-y">
                    {userComments.map((comment) => (
                      <Link key={comment.id} href={`/community/posts/${comment.post_id}`}>
                        <div className="p-4 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer touch-manipulation">
                          <div className="text-sm text-gray-500 mb-2">
                            <span className="font-medium text-secondary-600">{comment.post_title || '게시글'}</span>에 댓글을 남겼습니다
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
                            <span className="text-red-600">👍 {comment.upvotes || 0}</span>
                            <span className="text-gray-400">👎 {comment.downvotes || 0}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Activity */}
            {activeTab === 'activity' && (
              <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
                {/* Points Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">활동 등급 - 포인트 현황</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                      <div className="text-sm text-gray-600 mb-1">총 포인트</div>
                      <div className="text-base font-bold text-orange-600">{userData.points.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">활동 레벨</div>
                      <div className="text-base font-bold text-blue-600">ML{userData.level}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {userData.level < 10 ? `다음 레벨: ML${userData.level + 1}` : '최고 레벨'}
                      </div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  {(() => {
                    const levelThresholds = [0, 100, 300, 600, 1000, 2000, 4000, 8000, 16000, 32000];
                    const currentLevel = userData.level;
                    const currentPoints = userData.points;
                    const prevThreshold = levelThresholds[currentLevel - 1] || 0;
                    const nextThreshold = currentLevel < 10 ? levelThresholds[currentLevel] : prevThreshold;
                    const progress = nextThreshold > prevThreshold
                      ? Math.min(100, ((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
                      : 100;
                    const pointsNeeded = nextThreshold - currentPoints;

                    return (
                      <div className="mt-6 border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">레벨 진행도</span>
                          <span className="text-sm font-medium text-secondary-600">
                            ML{currentLevel} → {currentLevel < 10 ? `ML${currentLevel + 1}` : '최고 레벨'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-secondary-500 h-3 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{currentPoints.toLocaleString()} / {nextThreshold.toLocaleString()} 포인트</span>
                          <span>{pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} 포인트 남음` : '레벨업 완료!'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Activity Stats */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">활동 통계</h3>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">총 게시글</div>
                      <div className="text-2xl font-bold text-blue-600">{userStats?.post_count || 0}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">총 댓글</div>
                      <div className="text-2xl font-bold text-green-600">{userStats?.comment_count || 0}</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">팔로워</div>
                      <div className="text-2xl font-bold text-indigo-600">{userStats?.follower_count || 0}</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">팔로잉</div>
                      <div className="text-2xl font-bold text-pink-600">{userStats?.following_count || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Influence Grade Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 border-2 border-emerald-200">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{getInfluenceGrade(userStats?.follower_count || 0).emoji}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">영향력 등급</h3>
                      <p className="text-xs text-gray-500">지역구 내 팔로워 순위 기반 (명예 칭호)</p>
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-80 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getInfluenceGrade(userStats?.follower_count || 0).emoji}</span>
                        <div>
                          <div className="text-2xl font-bold text-emerald-900">
                            {getInfluenceGrade(userStats?.follower_count || 0).title} ({getInfluenceGrade(userStats?.follower_count || 0).titleEn})
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">팔로워</div>
                        <div className="text-xl font-bold text-indigo-600">{userStats?.follower_count || 0}명</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(userStats?.follower_count || 0) < 10 ? '10명 이상 시 기사 등급' : '팔로워 활동 중'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">지역</div>
                        <div className="text-xl font-bold text-emerald-900">
                          {userData.preferred_district
                            ? userData.preferred_district.split('|')[0]
                            : '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {userData.preferred_district
                            ? userData.preferred_district.split('|')[1] || ''
                            : '프로필에서 설정'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-100 bg-opacity-60 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="mr-2">🎯</span>
                        <span>다음 등급: <span className="font-bold text-emerald-900">
                          {(userStats?.follower_count || 0) < 10 ? '기사 (Knight)' :
                           (userStats?.follower_count || 0) < 50 ? '영주 (Lord)' :
                           (userStats?.follower_count || 0) < 200 ? '공작 (Duke)' : '군주 (Monarch)'}
                        </span></span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {(userStats?.follower_count || 0) < 10 ? '팔로워 10명 이상' :
                         (userStats?.follower_count || 0) < 50 ? '상위 20% + 팔로워 50명' :
                         (userStats?.follower_count || 0) < 200 ? '상위 5% + 팔로워 200명' : '1위 + 팔로워 500명'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 text-center">
                    ※ 영향력 등급은 실시간으로 갱신됩니다
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 등급 승급 모달 */}
      {notification && (
        <GradeUpgradeModal
          isOpen={notification.showModal}
          onClose={closeModal}
          gradeType={notification.gradeType}
          previousGrade={notification.previousGrade}
          newGrade={notification.newGrade}
        />
      )}
    </div>
  );
}
