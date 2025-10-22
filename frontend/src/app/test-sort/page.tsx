'use client'

import React, { useState } from 'react'
import { SortDropdown, SortDropdownLabel, SimpleSortDropdown } from '@/components/common'
import { SortValue, DEFAULT_SORT_OPTIONS } from '@/types/sort'
import { ArrowUpDown, Info } from 'lucide-react'

/**
 * Test page for SortDropdown component
 *
 * This page demonstrates the SortDropdown component functionality
 * including all features like keyboard navigation, click outside, and animations
 */
export default function TestSortPage() {
  const [sortValue, setSortValue] = useState<SortValue>('rating_desc')
  const [isDisabled, setIsDisabled] = useState(false)

  // Mock data for demonstration
  const mockPoliticians = [
    { id: 1, name: '김철수', party: '더불어민주당', rating: 4.5, electionCount: 3 },
    { id: 2, name: '이영희', party: '국민의힘', rating: 3.8, electionCount: 2 },
    { id: 3, name: '박민수', party: '정의당', rating: 4.2, electionCount: 1 },
    { id: 4, name: '정수연', party: '무소속', rating: 4.8, electionCount: 4 },
    { id: 5, name: '최동욱', party: '개혁신당', rating: 3.5, electionCount: 1 },
  ]

  // Sort politicians based on selected option
  const sortedPoliticians = [...mockPoliticians].sort((a, b) => {
    switch (sortValue) {
      case 'rating_desc':
        return b.rating - a.rating
      case 'rating_asc':
        return a.rating - b.rating
      case 'name_asc':
        return a.name.localeCompare(b.name, 'ko-KR')
      case 'election_desc':
        return b.electionCount - a.electionCount
      case 'recent_rating':
        // Mock: just reverse order for demo
        return b.id - a.id
      default:
        return 0
    }
  })

  const selectedOption = DEFAULT_SORT_OPTIONS.find(opt => opt.value === sortValue)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <ArrowUpDown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            정렬 드롭다운 테스트
          </h1>
          <p className="text-lg text-gray-600">
            SortDropdown 컴포넌트 기능 데모
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Sort Dropdown Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                정렬 컨트롤
              </h2>

              <div className="space-y-4">
                <div>
                  <SortDropdownLabel>정렬 방식 선택</SortDropdownLabel>
                  <SortDropdown
                    value={sortValue}
                    onChange={setSortValue}
                    options={DEFAULT_SORT_OPTIONS}
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="disable-toggle"
                    checked={isDisabled}
                    onChange={(e) => setIsDisabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="disable-toggle" className="text-sm text-gray-700">
                    드롭다운 비활성화
                  </label>
                </div>
              </div>
            </div>

            {/* Current Selection Info */}
            <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                현재 선택 정보
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 font-medium">값:</span>
                  <code className="px-2 py-1 bg-white rounded text-sm font-mono text-blue-900">
                    {sortValue}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 font-medium">라벨:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {selectedOption?.label}
                  </span>
                </div>
                {selectedOption?.description && (
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-xs text-blue-600">
                      {selectedOption.description}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                키보드 단축키
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    Enter
                  </kbd>
                  <span className="text-sm text-gray-600 pt-1">
                    드롭다운 열기 또는 옵션 선택
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    Space
                  </kbd>
                  <span className="text-sm text-gray-600 pt-1">
                    드롭다운 열기 또는 옵션 선택
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex gap-1">
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      ↑
                    </kbd>
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      ↓
                    </kbd>
                  </div>
                  <span className="text-sm text-gray-600 pt-1">
                    옵션 간 이동
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    Esc
                  </kbd>
                  <span className="text-sm text-gray-600 pt-1">
                    드롭다운 닫기
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    Home
                  </kbd>
                  <span className="text-sm text-gray-600 pt-1">
                    첫 번째 옵션으로 이동
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    End
                  </kbd>
                  <span className="text-sm text-gray-600 pt-1">
                    마지막 옵션으로 이동
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Sorted Results */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                정렬된 결과
              </h2>

              <div className="space-y-3">
                {sortedPoliticians.map((politician, index) => (
                  <div
                    key={politician.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900">
                        {politician.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {politician.party}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">평점</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">
                          {politician.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">당선</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                          {politician.electionCount}선
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                구현된 기능
              </h3>
              <ul className="space-y-2">
                {[
                  '커스텀 드롭다운 디자인 (네이티브 select 대체)',
                  '현재 선택 항목 표시',
                  '부드러운 열림/닫힘 애니메이션',
                  '외부 클릭 시 자동 닫기',
                  '키보드 네비게이션 (↑↓ 화살표 키)',
                  'Enter/Space로 선택',
                  'Escape로 닫기',
                  'Home/End로 첫/마지막 이동',
                  '포커스 관리 및 스크롤',
                  'ARIA 속성으로 접근성 지원',
                  '반응형 디자인',
                  '비활성화 상태 지원',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>PoliticianFinder - SortDropdown Component Test Page</p>
          <p className="mt-1">작업지시서 P2F5 구현 완료</p>
        </div>
      </div>
    </div>
  )
}
