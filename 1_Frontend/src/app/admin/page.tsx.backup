'use client';

import Link from 'next/link';
import AdminSidebar from './components/AdminSidebar';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Dashboard Section */}
          <section id="dashboard">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">대시보드</h1>

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
                  <p className="text-2xl font-bold text-gray-900">1,234명</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">총 정치인 수</p>
                  <p className="text-2xl font-bold text-gray-900">152명</p>
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
                  <p className="text-2xl font-bold text-gray-900">5,678개</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">처리 대기 신고</p>
                  <p className="text-2xl font-bold text-gray-900">12건</p>
                </div>
              </div>
            </div>

            {/* Recent Activities & Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 최근 활동 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">최근 활동</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="bg-blue-100 text-blue-600 p-1 rounded-md text-xs">회원</span>
                    <p className="flex-1 text-gray-700">
                      <span className="font-semibold">정치신인</span>님이 신규 가입했습니다.
                    </p>
                    <span className="text-gray-400">방금 전</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="bg-red-100 text-red-600 p-1 rounded-md text-xs">신고</span>
                    <p className="flex-1 text-gray-700">
                      <span className="font-semibold">불량유저</span>님의 댓글에 대한 신고가 접수되었습니다.
                    </p>
                    <span className="text-gray-400">5분 전</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="bg-green-100 text-green-600 p-1 rounded-md text-xs">정치인</span>
                    <p className="flex-1 text-gray-700">
                      <span className="font-semibold">김민준</span> 의원의 프로필이 업데이트되었습니다.
                    </p>
                    <span className="text-gray-400">1시간 전</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="bg-yellow-100 text-yellow-600 p-1 rounded-md text-xs">게시글</span>
                    <p className="flex-1 text-gray-700">[공지] 서버 점검 안내 게시글이 등록되었습니다.</p>
                    <span className="text-gray-400">3시간 전</span>
                  </div>
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
          </section>
        </main>
      </div>
    </div>
  );
}
