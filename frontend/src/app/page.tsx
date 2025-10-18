'use client'

import { Header } from '@/components/Header'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" role="main">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            훌륭한 정치인을 찾아드립니다
          </h1>
          <p className="mt-5 max-w-4xl mx-auto text-xl sm:text-2xl md:mt-8 md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm">
            AI 기반의 정치인 평가 플랫폼
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative" role="search" aria-label="정치인 검색">
            <label htmlFor="search-input" className="sr-only">정치인 검색</label>
            <input
              id="search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="정치인 이름, 정당, 지역으로 검색하세요..."
              className="w-full px-4 py-4 pr-12 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="정치인 검색 입력"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="검색하기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Hot Posts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🔥 실시간 인기글
            </h2>
            <Link href="/community" className="text-purple-600 hover:text-purple-700 font-medium">
              전체보기 →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-600 font-bold">#{i}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">HOT</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 hover:text-purple-600 mb-1">
                        인기 게시글 제목이 여기에 표시됩니다
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>작성자</span>
                        <span>•</span>
                        <span>👁️ 1.2k</span>
                        <span>💬 42</span>
                        <span>⬆️ 156</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Politician Posts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🏛️ 정치인이 직접 쓴 글
            </h2>
            <Link href="/community?category=politician_post" className="text-purple-600 hover:text-purple-700 font-medium">
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    홍
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">홍길동</span>
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">🏛️ 본인</span>
                    </div>
                    <span className="text-sm text-gray-600">서울 강남구 국회의원</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  지역 현안에 대한 정치인의 입장문
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>2시간 전</span>
                  <span>•</span>
                  <span>👁️ 856</span>
                  <span>💬 23</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">빠른 검색</h3>
            <p className="text-gray-600">
              이름, 정당, 지역 등 다양한 조건으로 정치인을 쉽게 찾아보세요.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">상세 정보</h3>
            <p className="text-gray-600">
              경력, 학력, 공약, 의정 활동 등 상세한 정보를 확인하세요.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">평가 및 리뷰</h3>
            <p className="text-gray-600">
              {isAuthenticated
                ? '다른 사용자들의 평가를 보고 직접 평가를 남겨보세요.'
                : '로그인하면 정치인 평가를 남길 수 있습니다.'}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="bg-purple-600 rounded-lg shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              더 많은 기능을 이용하세요!
            </h2>
            <p className="text-purple-100 mb-6">
              로그인하면 정치인 평가, 관심 정치인 저장 등 더 많은 기능을 사용할 수 있습니다.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-purple-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-purple-500 text-white font-medium rounded-md hover:bg-purple-400 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        )}

        {/* User Welcome */}
        {isAuthenticated && user && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              환영합니다, {user.user_metadata?.name || user.email?.split('@')[0]}님!
            </h2>
            <p className="text-gray-600 mb-4">
              이제 모든 기능을 이용하실 수 있습니다.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/politicians"
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
              >
                정치인 목록 보기
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                내 프로필
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 PoliticianFinder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
