'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInfluenceGrade, formatInfluenceGrade } from '@/utils/memberLevel';
import GradeUpgradeModal from '@/components/GradeUpgradeModal';
import useGradeNotification from '@/hooks/useGradeNotification';

type TabType = 'posts' | 'comments' | 'activity' | 'favorites';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  level: number;
  profile_image_url: string | null;
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

interface FavoritePolitician {
  id: string;
  politician_id: string;
  notes: string | null;
  notification_enabled: boolean;
  is_pinned: boolean;
  created_at: string;
  politicians: {
    id: string;
    name: string;
    party: string;
    position: string;
    profile_image_url: string | null;
  };
}

export default function MypagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritePoliticians, setFavoritePoliticians] = useState<FavoritePolitician[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // 등급 변동 알림 훅
  const { notification, closeModal } = useGradeNotification({
    activityLevel: userStats?.activity_level,
    influenceGrade: userStats?.influence_grade,
    isLoggedIn: !!userData,
  });

  useEffect(() => {
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
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
        console.error('Failed to fetch user posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [userData, activeTab]);

  // Fetch favorite politicians when favorites tab is active
  useEffect(() => {
    const fetchFavoritePoliticians = async () => {
      if (!userData || activeTab !== 'favorites') return;

      try {
        setFavoritesLoading(true);
        const response = await fetch('/api/favorites');
        const result = await response.json();

        if (result.success && result.data) {
          setFavoritePoliticians(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch favorite politicians:', err);
      } finally {
        setFavoritesLoading(false);
      }
    };

    fetchFavoritePoliticians();
  }, [userData, activeTab]);

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

          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 overflow-hidden bg-secondary-500">
                  {userData.profile_image_url ? (
                    <img
                      src={userData.profile_image_url}
                      alt="프로필"
                      className="w-full h-full object-cover"
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

              {/* Stats */}
              <div className="mt-6 pt-6 border-t grid grid-cols-5 gap-2 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">{userStats?.post_count || 0}</div>
                  <div className="text-xs text-gray-500">게시글</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{userStats?.comment_count || 0}</div>
                  <div className="text-xs text-gray-500">댓글</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{userData.points.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">포인트</div>
                </div>
                <Link
                  href={`/users/${userData.id}/followers`}
                  className="hover:bg-gray-50 rounded-lg p-1 transition cursor-pointer"
                >
                  <div className="text-xl font-bold text-gray-900">{userStats?.follower_count || 0}</div>
                  <div className="text-xs text-gray-500">팔로워</div>
                </Link>
                <Link
                  href={`/users/${userData.id}/following`}
                  className="hover:bg-gray-50 rounded-lg p-1 transition cursor-pointer"
                >
                  <div className="text-xl font-bold text-gray-900">{userStats?.following_count || 0}</div>
                  <div className="text-xs text-gray-500">팔로잉</div>
                </Link>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <Link
                  href="/profile/edit"
                  className="block w-full text-center px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-secondary-300"
                >
                  프로필 수정
                </Link>
                <Link
                  href="/settings"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  설정
                </Link>
              </div>
            </div>
          </div>

          {/* Right Content: Tabs */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none ${
                      activeTab === 'posts'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    내 게시글
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none ${
                      activeTab === 'comments'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    내 댓글
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none ${
                      activeTab === 'activity'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    활동 내역
                  </button>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition focus:outline-none ${
                      activeTab === 'favorites'
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    관심 정치인
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content: Posts */}
            {activeTab === 'posts' && (
              <div>
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
                        <div className="p-4 hover:bg-gray-50 transition cursor-pointer">
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
              <div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {/* Comment Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="text-sm text-gray-500 mb-2">
                      <a href="#" className="font-medium text-secondary-600 hover:underline">2025년 정치 개혁 방향</a>에 댓글을 남겼습니다
                    </div>
                    <p className="text-sm text-gray-900">
                      정말 공감합니다. 특히 투명성 강화 부분이 중요하다고 생각해요. 국민들이 정치인의 활동을 실시간으로 볼 수 있어야 합니다.
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>2025-01-24 14:32</span>
                      <span className="text-red-600">👍 5</span>
                      <span className="text-gray-400">👎 1</span>
                    </div>
                  </div>

                  {/* Comment Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="text-sm text-gray-500 mb-2">
                      <a href="#" className="font-medium text-secondary-600 hover:underline">AI 평가의 한계점</a>에 댓글을 남겼습니다
                    </div>
                    <p className="text-sm text-gray-900">
                      AI도 결국 데이터를 기반으로 하기 때문에 편향이 있을 수 있다는 점을 인지해야 합니다. 하지만 그럼에도 기존 방식보다는 객관적이라고 봅니다.
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>2025-01-23 09:15</span>
                      <span className="text-red-600">👍 12</span>
                      <span className="text-gray-400">👎 0</span>
                    </div>
                  </div>

                  {/* Comment Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="text-sm text-gray-500 mb-2">
                      <a href="#" className="font-medium text-secondary-600 hover:underline">지역구 의원 활동 비교</a>에 댓글을 남겼습니다
                    </div>
                    <p className="text-sm text-gray-900">
                      우리 지역구 의원은 AI 평가에서 높은 점수를 받았는데 실제로도 활동을 열심히 하시더라고요. 믿을만한 것 같습니다.
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>2025-01-21 18:42</span>
                      <span className="text-red-600">👍 8</span>
                      <span className="text-gray-400">👎 2</span>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-center">
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      이전
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-secondary-500 text-sm font-medium text-white">
                      1
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      2
                    </button>
                    <button className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Tab Content: Activity */}
            {activeTab === 'activity' && (
              <div>
                {/* Points Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">활동 등급 - 포인트 현황</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                      <div className="text-sm text-gray-600 mb-1">연간 포인트 (2025년)</div>
                      <div className="text-3xl font-bold text-orange-600">1,248</div>
                      <div className="text-xs text-gray-500 mt-1">레벨: ML5</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">월간 포인트 (1월)</div>
                      <div className="text-3xl font-bold text-blue-600">187</div>
                      <div className="text-xs text-gray-500 mt-1">이번 달 순위: 12위</div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">레벨 진행도</span>
                      <span className="text-sm font-medium text-secondary-600">ML5 → ML6</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-secondary-500 h-3 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>1,248 / 2,000 포인트</span>
                      <span>752 포인트 남음</span>
                    </div>
                  </div>

                  {/* Monthly Points History */}
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">월별 포인트 내역</h4>
                    <div className="grid grid-cols-6 gap-2 text-center">
                      <div className="bg-blue-100 rounded p-2">
                        <div className="text-xs text-gray-600">1월</div>
                        <div className="text-sm font-bold text-blue-700">187</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-xs text-gray-600">12월</div>
                        <div className="text-sm font-bold text-gray-700">245</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-xs text-gray-600">11월</div>
                        <div className="text-sm font-bold text-gray-700">198</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-xs text-gray-600">10월</div>
                        <div className="text-sm font-bold text-gray-700">156</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-xs text-gray-600">9월</div>
                        <div className="text-sm font-bold text-gray-700">223</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-xs text-gray-600">8월</div>
                        <div className="text-sm font-bold text-gray-700">189</div>
                      </div>
                    </div>
                    <div className="text-right mt-2">
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">전체 보기 →</button>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">활동 통계</h3>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">총 게시글</div>
                      <div className="text-2xl font-bold text-blue-600">24</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">총 댓글</div>
                      <div className="text-2xl font-bold text-green-600">156</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">받은 공감</div>
                      <div className="text-2xl font-bold text-green-600">342</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">정치인 평가</div>
                      <div className="text-2xl font-bold text-indigo-600">18</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Best 글</div>
                      <div className="text-2xl font-bold text-pink-600">3</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Hot 글</div>
                      <div className="text-2xl font-bold text-red-600">5</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="border-t pt-6 mt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">최근 활동</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">게시글 작성</p>
                          <p className="text-xs text-gray-500">AI 평가 시스템의 신뢰성에 대한 토론 • 2025-01-24</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">댓글 작성</p>
                          <p className="text-xs text-gray-500">2025년 정치 개혁 방향 • 2025-01-24</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">정치인 평가</p>
                          <p className="text-xs text-gray-500">홍길동 국회의원 평가 참여 • 2025-01-24</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">공감 받음</p>
                          <p className="text-xs text-gray-500">우리 동네 국회의원 찾기 기능 건의 • 2025-01-23</p>
                        </div>
                      </div>
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
                          <div className="text-sm text-gray-600 mt-1">📍 지역 미설정</div>
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
                        <div className="text-xs text-gray-500 mb-1">지역 순위</div>
                        <div className="text-xl font-bold text-emerald-900">-</div>
                        <div className="text-xs text-gray-500 mt-1">지역 설정 필요</div>
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

            {/* Tab Content: Favorites */}
            {activeTab === 'favorites' && (
              <div>
                {favoritesLoading ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">관심 정치인 목록을 불러오는 중...</p>
                  </div>
                ) : favoritePoliticians.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">등록된 관심 정치인이 없습니다.</p>
                    <Link
                      href="/politicians"
                      className="inline-block px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition"
                    >
                      정치인 둘러보기
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md divide-y">
                    {favoritePoliticians.map((favorite) => (
                      <Link key={favorite.id} href={`/politicians/${favorite.politician_id}`}>
                        <div className="p-4 hover:bg-gray-50 transition cursor-pointer">
                          <div className="flex items-center gap-4">
                            {/* 프로필 이미지 */}
                            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                              {favorite.politicians?.profile_image_url ? (
                                <img
                                  src={favorite.politicians.profile_image_url}
                                  alt={favorite.politicians.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            {/* 정치인 정보 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {favorite.politicians?.name || '알 수 없음'}
                                </h3>
                                {favorite.is_pinned && (
                                  <span className="text-yellow-500" title="고정됨">📌</span>
                                )}
                                {favorite.notification_enabled && (
                                  <span className="text-blue-500" title="알림 활성화">🔔</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600">
                                  {favorite.politicians?.party || '무소속'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm text-gray-500">
                                  {favorite.politicians?.position || '정치인'}
                                </span>
                              </div>
                              {favorite.notes && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  메모: {favorite.notes}
                                </p>
                              )}
                            </div>

                            {/* 등록일 */}
                            <div className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(favorite.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* 정치인 페이지 링크 */}
                {favoritePoliticians.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/politicians"
                      className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                    >
                      더 많은 정치인 둘러보기 →
                    </Link>
                  </div>
                )}
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
