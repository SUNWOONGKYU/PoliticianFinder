'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock user ID - in real implementation, get from auth context
const CURRENT_USER_ID = '1';

type TabType = 'posts' | 'comments' | 'activity';

export default function MypagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-secondary-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">민주시민</h2>
                <p className="text-sm text-gray-500 mt-1">demo@example.com</p>
                <span className="inline-block bg-secondary-100 text-secondary-700 text-xs font-semibold px-3 py-1 rounded-full mt-2">ML5</span>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t grid grid-cols-5 gap-2 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">24</div>
                  <div className="text-xs text-gray-500">게시글</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">156</div>
                  <div className="text-xs text-gray-500">댓글</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">1,248</div>
                  <div className="text-xs text-gray-500">포인트</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">2.5K</div>
                  <div className="text-xs text-gray-500">팔로워</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">128</div>
                  <div className="text-xs text-gray-500">팔로잉</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <Link
                  href={`/users/${CURRENT_USER_ID}/profile`}
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
                </nav>
              </div>
            </div>

            {/* Tab Content: Posts */}
            {activeTab === 'posts' && (
              <div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {/* Post Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 hover:text-secondary-600 cursor-pointer">
                          AI 평가 시스템의 신뢰성에 대한 토론
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          Claude AI의 정치인 평가가 얼마나 객관적일 수 있을까요? 여러분의 의견을 들어보고 싶습니다...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>2025-01-24 10:23</span>
                          <span>조회수 234</span>
                          <span className="text-red-600">👍 12</span>
                          <span className="text-gray-400">👎 3</span>
                          <span>댓글 8</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>공유 5</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 hover:text-secondary-600 cursor-pointer">
                          우리 동네 국회의원 찾기 기능 건의
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          주소 입력하면 해당 지역구 국회의원을 바로 볼 수 있으면 좋겠어요...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>2025-01-22 16:45</span>
                          <span>조회수 156</span>
                          <span className="text-red-600">👍 28</span>
                          <span className="text-gray-400">👎 5</span>
                          <span>댓글 15</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>공유 3</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Item */}
                  <div className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 hover:text-secondary-600 cursor-pointer">
                          정치인 평가 기준이 궁금합니다
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          AI가 어떤 데이터를 기반으로 평가하는지 자세한 설명이 있으면 좋겠습니다...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>2025-01-20 09:12</span>
                          <span>조회수 189</span>
                          <span className="text-red-600">👍 7</span>
                          <span className="text-gray-400">👎 2</span>
                          <span>댓글 12</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>공유 4</span>
                          </span>
                        </div>
                      </div>
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
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      3
                    </button>
                    <button className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      다음
                    </button>
                  </nav>
                </div>
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
                    <div className="text-3xl mr-3">🏰</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">영향력 등급</h3>
                      <p className="text-xs text-gray-500">지역구 내 팔로워 순위 기반 (명예 칭호)</p>
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-80 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏰</span>
                        <div>
                          <div className="text-2xl font-bold text-emerald-900">영주 (Lord)</div>
                          <div className="text-sm text-gray-600 mt-1">📍 서울 강남구 갑</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">팔로워</div>
                        <div className="text-xl font-bold text-indigo-600">327명</div>
                        <div className="text-xs text-green-600 mt-1">▲ 12명 (이번 주)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">지역 순위</div>
                        <div className="text-xl font-bold text-emerald-900">상위 15%</div>
                        <div className="text-xs text-gray-500 mt-1">1,247명 중 187위</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-100 bg-opacity-60 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="mr-2">🎯</span>
                        <span>다음 등급: <span className="font-bold text-emerald-900">공작 (Duke)</span></span>
                      </div>
                      <div className="text-xs text-gray-600">
                        상위 5% 진입 시
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
    </div>
  );
}
