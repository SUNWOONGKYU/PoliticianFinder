'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { POLITICAL_PARTIES, REGIONS, POSITIONS } from '@/types/filter';

/**
 * SearchFilter 컴포넌트 Props
 */
export interface SearchFilterProps {
  searchQuery?: string;
  selectedParties?: string[];
  selectedRegions?: string[];
  selectedPositions?: string[];
  onSearchChange: (query: string) => void;
  onPartyChange: (parties: string[]) => void;
  onRegionChange: (regions: string[]) => void;
  onPositionChange: (positions: string[]) => void;
  onReset?: () => void;
  className?: string;
}

/**
 * SearchFilter 컴포넌트
 * 정치인 검색 및 필터링 기능 제공
 *
 * @features
 * - 검색어 입력
 * - 정당, 지역, 직급 필터
 * - 필터 초기화
 * - 반응형 디자인
 */
export function SearchFilter({
  searchQuery = '',
  selectedParties = [],
  selectedRegions = [],
  selectedPositions = [],
  onSearchChange,
  onPartyChange,
  onRegionChange,
  onPositionChange,
  onReset,
  className,
}: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  // 검색어 초기화
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  // 필터 토글
  const toggleParty = useCallback(
    (party: string) => {
      if (selectedParties.includes(party)) {
        onPartyChange(selectedParties.filter((p) => p !== party));
      } else {
        onPartyChange([...selectedParties, party]);
      }
    },
    [selectedParties, onPartyChange]
  );

  const toggleRegion = useCallback(
    (region: string) => {
      if (selectedRegions.includes(region)) {
        onRegionChange(selectedRegions.filter((r) => r !== region));
      } else {
        onRegionChange([...selectedRegions, region]);
      }
    },
    [selectedRegions, onRegionChange]
  );

  const togglePosition = useCallback(
    (position: string) => {
      if (selectedPositions.includes(position)) {
        onPositionChange(selectedPositions.filter((p) => p !== position));
      } else {
        onPositionChange([...selectedPositions, position]);
      }
    },
    [selectedPositions, onPositionChange]
  );

  // 필터 초기화
  const handleReset = useCallback(() => {
    onSearchChange('');
    onPartyChange([]);
    onRegionChange([]);
    onPositionChange([]);
    onReset?.();
  }, [onSearchChange, onPartyChange, onRegionChange, onPositionChange, onReset]);

  // 활성화된 필터 개수
  const activeFiltersCount =
    selectedParties.length +
    selectedRegions.length +
    selectedPositions.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 검색 바 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="정치인 이름으로 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="검색어 지우기"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 필터 토글 버튼 */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          필터
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* 초기화 버튼 */}
        {(searchQuery || activeFiltersCount > 0) && (
          <Button variant="ghost" onClick={handleReset}>
            초기화
          </Button>
        )}
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          {/* 정당 필터 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">정당</h3>
            <div className="flex flex-wrap gap-2">
              {POLITICAL_PARTIES.map((party) => (
                <button
                  key={party.value}
                  onClick={() => toggleParty(party.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    selectedParties.includes(party.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  )}
                >
                  {party.label}
                </button>
              ))}
            </div>
          </div>

          {/* 지역 필터 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">지역</h3>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region.value}
                  onClick={() => toggleRegion(region.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    selectedRegions.includes(region.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  )}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          {/* 직급 필터 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">직급</h3>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((position) => (
                <button
                  key={position.value}
                  onClick={() => togglePosition(position.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    selectedPositions.includes(position.value)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  )}
                >
                  {position.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
