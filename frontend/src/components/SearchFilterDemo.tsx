'use client'

import React, { useState } from 'react'
import { SearchFilter } from './SearchFilter'
import { SearchFilterParams } from '@/types/filter'

/**
 * SearchFilterDemo Component
 *
 * Demo page to test and showcase the SearchFilter component functionality
 */
export function SearchFilterDemo() {
  const [currentFilters, setCurrentFilters] = useState<SearchFilterParams>({})
  const [filterHistory, setFilterHistory] = useState<SearchFilterParams[]>([])

  const handleFilterChange = (filters: SearchFilterParams) => {
    console.log('Filters changed:', filters)
    setCurrentFilters(filters)
    setFilterHistory((prev) => [...prev.slice(-4), filters])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SearchFilter Component Demo
          </h1>
          <p className="text-gray-600">
            정치인 목록 검색 및 필터링 컴포넌트 테스트 페이지
          </p>
        </div>

        {/* SearchFilter Component */}
        <SearchFilter onFilterChange={handleFilterChange} />

        {/* Current Filters Display */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            현재 적용된 필터
          </h2>
          <div className="bg-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
            <pre>{JSON.stringify(currentFilters, null, 2)}</pre>
          </div>
        </div>

        {/* Filter History */}
        {filterHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              필터 변경 기록 (최근 5개)
            </h2>
            <div className="space-y-4">
              {filterHistory.map((filters, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-md p-4 border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      변경 #{filterHistory.length - index}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(filters, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            구현된 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">검색 기능</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>이름 검색 (최소 2글자)</li>
                <li>정당 검색 (최소 2글자)</li>
                <li>지역구 검색 (최소 2글자)</li>
                <li>500ms Debounce 적용</li>
                <li>검색어 삭제 버튼</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">필터 기능</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>정당 다중 선택</li>
                <li>지역 다중 선택</li>
                <li>직책 다중 선택</li>
                <li>당선 횟수 필터</li>
                <li>필터 초기화</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">정렬 기능</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>이름순 정렬</li>
                <li>평점순 정렬</li>
                <li>평가 수순 정렬</li>
                <li>최신순 정렬</li>
                <li>오름차순/내림차순</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">UI/UX</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>반응형 디자인</li>
                <li>모바일 접기/펼치기</li>
                <li>Tailwind CSS 스타일링</li>
                <li>접근성 레이블</li>
                <li>시각적 피드백</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            사용 예제
          </h2>
          <div className="bg-gray-900 rounded-md p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
{`import { SearchFilter } from '@/components/SearchFilter'
import { SearchFilterParams } from '@/types/filter'

function PoliticianListPage() {
  const handleFilterChange = (filters: SearchFilterParams) => {
    // API 호출 또는 상태 업데이트
    console.log('Filters changed:', filters)

    // 예: API 호출
    fetchPoliticians({
      page: 1,
      limit: 20,
      search: filters.searchName,
      party: filters.parties?.join(','),
      region: filters.regions?.join(','),
      position: filters.positions?.join(','),
      sort: filters.sortBy,
      order: filters.sortOrder,
    })
  }

  return (
    <div>
      <SearchFilter onFilterChange={handleFilterChange} />
      {/* 정치인 목록 표시 */}
    </div>
  )
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
