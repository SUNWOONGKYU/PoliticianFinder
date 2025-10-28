'use client'

import React, { useState } from 'react'
import SearchFilterEnhanced from '@/components/SearchFilterEnhanced'
import { SearchFilterParams } from '@/types/filter'

export default function TestFilterEnhancedPage() {
  const [filters, setFilters] = useState<SearchFilterParams>({
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [loading, setLoading] = useState(false)
  const [filterHistory, setFilterHistory] = useState<{
    timestamp: string
    filters: SearchFilterParams
  }[]>([])

  const handleFilterChange = (newFilters: SearchFilterParams) => {
    console.log('Filter Changed:', newFilters)
    setFilters(newFilters)

    // Add to history
    setFilterHistory(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        filters: newFilters
      },
      ...prev.slice(0, 9) // Keep last 10 entries
    ])
  }

  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">향상된 검색 필터 테스트</h1>
          <p className="mt-2 text-gray-600">
            개선된 UI/UX와 추가 기능들을 테스트해보세요
          </p>
        </div>

        {/* Loading Test Button */}
        <div className="mb-6">
          <button
            onClick={simulateLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            로딩 상태 시뮬레이션 (2초)
          </button>
          {loading && (
            <span className="ml-3 text-gray-600">필터가 로딩중입니다...</span>
          )}
        </div>

        {/* Enhanced SearchFilter Component */}
        <SearchFilterEnhanced
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          loading={loading}
          className="mb-8"
        />

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Filter State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              현재 필터 상태
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {JSON.stringify(filters, null, 2)}
              </pre>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">필터 요약</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>검색어 필터: {
                  [filters.searchName, filters.searchParty, filters.searchRegion]
                    .filter(Boolean).length
                }개</p>
                <p>정당 필터: {filters.parties?.length || 0}개</p>
                <p>지역 필터: {filters.regions?.length || 0}개</p>
                <p>직책 필터: {filters.positions?.length || 0}개</p>
                <p>당선 횟수: {filters.minElectionCount ? `${filters.minElectionCount}선 이상` : '없음'}</p>
                <p>정렬: {filters.sortBy} ({filters.sortOrder === 'asc' ? '오름차순' : '내림차순'})</p>
              </div>
            </div>
          </div>

          {/* Filter History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              필터 변경 이력
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filterHistory.length === 0 ? (
                <p className="text-gray-500">필터를 변경해보세요</p>
              ) : (
                filterHistory.map((entry, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        #{filterHistory.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp}
                      </span>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        상세보기
                      </summary>
                      <pre className="mt-2 text-gray-600 whitespace-pre-wrap font-mono overflow-x-auto">
                        {JSON.stringify(entry.filters, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            향상된 기능 체크리스트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">활성 필터 표시</div>
                <div className="text-sm text-gray-500">
                  상단에 현재 적용된 필터들이 pill 형태로 표시
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">필터 개수 뱃지</div>
                <div className="text-sm text-gray-500">
                  적용된 필터 개수가 실시간으로 표시
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">개별 필터 제거</div>
                <div className="text-sm text-gray-500">
                  활성 필터 pill의 X 버튼으로 개별 제거 가능
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">최소 글자수 안내</div>
                <div className="text-sm text-gray-500">
                  1글자 입력시 "최소 2글자 이상" 메시지 표시
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">선택 상태 체크 아이콘</div>
                <div className="text-sm text-gray-500">
                  선택된 필터 버튼에 체크 아이콘 표시
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">로딩 상태 처리</div>
                <div className="text-sm text-gray-500">
                  로딩중 버튼 비활성화 및 opacity 변경
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">데스크톱 헤더</div>
                <div className="text-sm text-gray-500">
                  데스크톱에서 필터 헤더와 초기화 버튼 표시
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <div className="font-medium">Debounce 최적화</div>
                <div className="text-sm text-gray-500">
                  검색 입력시 500ms 지연 후 필터 적용
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            테스트 시나리오
          </h2>
          <ol className="space-y-2 text-gray-700">
            <li>1. 검색어를 입력하고 500ms 기다려서 debounce 동작 확인</li>
            <li>2. 1글자만 입력하여 경고 메시지 확인</li>
            <li>3. 여러 필터를 선택하고 상단 필터 개수 확인</li>
            <li>4. 활성 필터 pill의 X 버튼으로 개별 제거</li>
            <li>5. 로딩 시뮬레이션 버튼으로 로딩 상태 확인</li>
            <li>6. 모바일 크기로 화면 줄여서 반응형 디자인 확인</li>
            <li>7. 초기화 버튼으로 모든 필터 초기화</li>
          </ol>
        </div>
      </div>
    </div>
  )
}