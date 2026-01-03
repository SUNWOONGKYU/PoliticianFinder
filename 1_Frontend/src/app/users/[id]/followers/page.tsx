// P3BA36: 팔로워 목록 페이지
// 특정 사용자의 팔로워 목록을 표시

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FollowButton from '@/components/FollowButton';

interface Follower {
  id: string;
  username: string;
  profile_image_url: string | null;
  activity_level: string;
  influence_grade: string;
  follower_count: number;
  followed_at: string;
}

interface UserInfo {
  id: string;
  username: string;
  follower_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserInfo | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}/followers?page=${currentPage}&limit=20`);
        const result = await response.json();

        if (response.ok && result.success) {
          setUser(result.data.user);
          setFollowers(result.data.followers);
          setPagination(result.pagination);
        } else {
          setError(result.error || '팔로워 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch followers:', err);
        setError('서버 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, currentPage]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'Monarch': return 'text-yellow-600 bg-yellow-50';
      case 'Duke': return 'text-purple-600 bg-purple-50';
      case 'Lord': return 'text-blue-600 bg-blue-50';
      case 'Knight': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'Monarch': return '군주';
      case 'Duke': return '공작';
      case 'Lord': return '영주';
      case 'Knight': return '기사';
      default: return '방랑자';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-8 w-8 text-secondary-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-3 text-gray-600">로딩 중...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600"
            >
              뒤로 가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.username}님의 팔로워</h1>
              <p className="text-sm text-gray-500">{user?.follower_count || 0}명</p>
            </div>
          </div>
        </div>

        {/* Followers List */}
        <div className="bg-white rounded-lg shadow-md divide-y">
          {followers.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">아직 팔로워가 없습니다.</p>
            </div>
          ) : (
            followers.map((follower) => (
              <div key={follower.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/users/${follower.id}/profile`}
                    className="flex items-center gap-3 flex-1"
                  >
                    {/* Profile Image */}
                    <div className="relative w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {follower.profile_image_url ? (
                        <Image
                          src={follower.profile_image_url}
                          alt={follower.username}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{follower.username}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-secondary-100 text-secondary-600 rounded">
                          {follower.activity_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getGradeColor(follower.influence_grade)}`}>
                          {getGradeLabel(follower.influence_grade)}
                        </span>
                        <span className="text-xs text-gray-400">
                          팔로워 {follower.follower_count}명
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(follower.followed_at)}부터 팔로우
                      </p>
                    </div>
                  </Link>

                  {/* Follow Button */}
                  <FollowButton
                    targetUserId={follower.id}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-secondary-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
