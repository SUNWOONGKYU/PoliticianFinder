'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function NoticeDetailPage() {
  const params = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data - in production, fetch based on params.id
  const notice = {
    id: params.id,
    category: '공지사항',
    title: 'PoliticianFinder 정식 오픈!',
    author: '운영자',
    date: '2025.10.28',
    content: `안녕하세요, PoliticianFinder 팀입니다.

드디어 AI 기반 정치인 평가 커뮤니티 플랫폼, PoliticianFinder가 정식으로 오픈했습니다. 저희 플랫폼에 많은 관심을 가져주신 모든 분들께 진심으로 감사드립니다.`,
    imageUrl: 'https://images.unsplash.com/photo-1580130281329-197f6c59e5c3?q=80&w=2070&auto=format&fit=crop',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b-2 border-primary-500">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                PoliticianFinder
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-900 hover:text-primary-600 font-medium">홈</Link>
              <Link href="/politicians" className="text-gray-900 hover:text-primary-600 font-medium">정치인</Link>
              <Link href="/community" className="text-gray-900 hover:text-primary-600 font-medium">커뮤니티</Link>
              <Link href="/connection" className="text-gray-900 hover:text-primary-600 font-medium">연결</Link>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/auth/login" className="text-gray-900 hover:text-primary-600 font-medium px-4 py-2">로그인</Link>
              <Link href="/auth/signup" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium">회원가입</Link>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-900 hover:text-primary-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary-600">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
            </svg>
            홈으로
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded">
              📢 {notice.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{notice.title}</h1>

          <div className="border-b pb-4 mb-6 text-sm text-gray-500">
            <span>작성자: <span className="font-semibold text-gray-800">{notice.author}</span></span>
            <span className="mx-2">|</span>
            <span>게시일: {notice.date}</span>
          </div>

          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">안녕하세요, PoliticianFinder 팀입니다.</p>
            <p className="mb-4">
              드디어 AI 기반 정치인 평가 커뮤니티 플랫폼, PoliticianFinder가 정식으로 오픈했습니다.
              저희 플랫폼에 많은 관심을 가져주신 모든 분들께 진심으로 감사드립니다.
            </p>
            <img
              src={notice.imageUrl}
              alt="Launching Celebration"
              className="rounded-lg shadow-md my-6 w-full"
            />
            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">주요 기능 안내</h2>
            <p>PoliticianFinder는 다음과 같은 핵심 기능을 제공합니다:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>AI 정치인 평가:</strong> 5가지 AI 모델이 제공하는 객관적이고 다각적인 정치인 평가 리포트
              </li>
              <li>
                <strong>활발한 커뮤니티:</strong> 자유롭게 정치에 대해 토론하고 의견을 나눌 수 있는 공간
              </li>
              <li>
                <strong>직접 소통:</strong> 본인 인증된 정치인과 직접 소통할 수 있는 투명한 창구
              </li>
            </ul>
            <p>
              앞으로도 저희 PoliticianFinder는 더 나은 정치 환경을 만드는 데 기여할 수 있도록 끊임없이 노력하겠습니다.
              사용자 여러분의 많은 관심과 참여 부탁드립니다.
            </p>
            <p className="mt-6">
              감사합니다.<br />
              PoliticianFinder 팀 드림
            </p>
          </div>
        </article>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
