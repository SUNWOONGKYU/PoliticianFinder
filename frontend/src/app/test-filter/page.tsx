'use client'

import React, { useState } from 'react'
import SearchFilter from '@/components/SearchFilter'
import { SearchFilterParams } from '@/types/filter'

export default function TestFilterPage() {
  const [filters, setFilters] = useState<SearchFilterParams>({
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [filterLog, setFilterLog] = useState<SearchFilterParams[]>([])

  const handleFilterChange = (newFilters: SearchFilterParams) => {
    console.log('Filter Changed:', newFilters)
    setFilters(newFilters)
    setFilterLog(prev => [...prev, newFilters])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">검색 필터 테스트</h1>

        {/* SearchFilter Component */}
        <SearchFilter
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          className="mb-8"
        />

        {/* Current Filters Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">현재 필터 상태</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </div>

        {/* Filter Change Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            필터 변경 이력 ({filterLog.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filterLog.length === 0 ? (
              <p className="text-gray-500">아직 필터 변경사항이 없습니다.</p>
            ) : (
              filterLog.map((log, index) => (
                <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                  <div className="font-medium text-gray-700">
                    #{index + 1} - {new Date().toLocaleTimeString()}
                  </div>
                  <pre className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feature Test Results */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">기능 테스트 체크리스트</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="debounce" className="mt-1" />
              <label htmlFor="debounce" className="text-gray-700">
                <span className="font-medium">Debounce 기능</span>
                <p className="text-sm text-gray-500">검색 입력 시 500ms 지연 후 필터 적용 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="min-length" className="mt-1" />
              <label htmlFor="min-length" className="text-gray-700">
                <span className="font-medium">최소 글자수 제한</span>
                <p className="text-sm text-gray-500">검색어 2글자 이상 입력 시에만 필터 적용 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="multi-select" className="mt-1" />
              <label htmlFor="multi-select" className="text-gray-700">
                <span className="font-medium">다중 선택</span>
                <p className="text-sm text-gray-500">정당, 지역, 직책 다중 선택 기능 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="sort" className="mt-1" />
              <label htmlFor="sort" className="text-gray-700">
                <span className="font-medium">정렬 옵션</span>
                <p className="text-sm text-gray-500">정렬 기준 및 순서 변경 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="reset" className="mt-1" />
              <label htmlFor="reset" className="text-gray-700">
                <span className="font-medium">초기화 버튼</span>
                <p className="text-sm text-gray-500">모든 필터 초기화 기능 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="mobile" className="mt-1" />
              <label htmlFor="mobile" className="text-gray-700">
                <span className="font-medium">모바일 반응형</span>
                <p className="text-sm text-gray-500">화면 크기 줄여서 접기/펼치기 기능 확인</p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="clear-search" className="mt-1" />
              <label htmlFor="clear-search" className="text-gray-700">
                <span className="font-medium">검색어 지우기</span>
                <p className="text-sm text-gray-500">각 검색 필드의 X 버튼 동작 확인</p>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}