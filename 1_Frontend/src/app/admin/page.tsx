'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from './components/AdminSidebar';

interface DashboardData {
  total_users: number;
  total_posts: number;
  total_payments: number;
  pending_reports: number;
  recent_activity: Array<{
    type: string;
    user_name: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');

        if (!response.ok) {
          throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
          setError(null);
        } else {
          throw new Error(result.error || 'Invalid API response');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityBadgeStyle = (type: string) => {
    const styles: Record<string, string> = {
      '회원': 'bg-blue-100 text-blue-600',
      '신고': 'bg-red-100 text-red-600',
      '정치인': 'bg-green-100 text-green-600',
      '게시글': 'bg-yellow-100 text-yellow-600',
    };
    return styles[type] || 'bg-gray-100 text-gray-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Dashboard Section */}
          <section id="dashboard">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">대시보드</h1>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold">오류 발생</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Data Display */}
            {!loading && !error && data && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 회원 수</p>
                      <p className="text-2xl font-bold text-gray-900">{data.total_users.toLocaleString()}명</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 결제 건수</p>
                      <p className="text-2xl font-bold text-gray-900">{data.total_payments.toLocaleString()}건</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 게시글 수</p>
                      <p className="text-2xl font-bold text-gray-900">{data.total_posts.toLocaleString()}개</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">처리 대기 문의</p>
                      <p className="text-2xl font-bold text-gray-900">{data.pending_reports}건</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activities & Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 최근 활동 */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">최근 활동</h2>
                    <div className="space-y-4">
                      {data.recent_activity.length > 0 ? (
                        data.recent_activity.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <span className={`${getActivityBadgeStyle(activity.type)} p-1 rounded-md text-xs`}>
                              {activity.type}
                            </span>
                            <p className="flex-1 text-gray-700">
                              <span className="font-semibold">{activity.user_name}</span>
                              {activity.description}
                            </p>
                            <span className="text-gray-400">{formatTimestamp(activity.timestamp)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">최근 활동이 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* 주요 공지사항 */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">주요 공지사항</h2>
                    <div className="space-y-3">
                      <Link href="/notices/3" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <p className="font-semibold text-gray-800">커뮤니티 가이드라인 업데이트 안내</p>
                        <p className="text-sm text-gray-500">2025.10.28</p>
                      </Link>
                      <Link href="/notices/2" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <p className="font-semibold text-gray-800">AI 평가 시스템 v1.1 업데이트</p>
                        <p className="text-sm text-gray-500">2025.10.25</p>
                      </Link>
                      <Link href="/notices/1" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <p className="font-semibold text-gray-800">정식 서비스 오픈 안내</p>
                        <p className="text-sm text-gray-500">2025.10.20</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
