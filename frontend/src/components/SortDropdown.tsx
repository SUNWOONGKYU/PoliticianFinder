'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { SortDropdownProps, SortOption, DEFAULT_SORT_OPTIONS } from '../types/sort';

/**
 * 정렬 드롭다운 컴포넌트
 * 정치인 목록을 다양한 기준으로 정렬하기 위한 커스텀 드롭다운
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 옵션 찾기
  const selectedOption = options.find(option => option.value === value) || options[0];

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;

        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex]);
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          event.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, options]);

  // 포커스된 옵션이 보이도록 스크롤
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current) {
      const focusedElement = optionsRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // 드롭다운을 열 때 현재 선택된 옵션에 포커스
        const currentIndex = options.findIndex(opt => opt.value === value);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      } else {
        setFocusedIndex(-1);
      }
    }
  };

  const handleSelect = (option: SortOption) => {
    onChange(option.value);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
    >
      {/* 드롭다운 트리거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="정렬 방식 선택"
        className={`
          flex items-center justify-between
          min-w-[200px] px-4 py-2.5
          bg-white border border-gray-300 rounded-lg
          text-sm font-medium text-gray-700
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="mr-2">{selectedOption.label}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* 드롭다운 옵션 목록 */}
      {isOpen && (
        <div
          ref={optionsRef}
          role="listbox"
          aria-label="정렬 옵션"
          className="
            absolute z-50 mt-2 w-full
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-60 overflow-auto
            animate-in fade-in-0 zoom-in-95
            origin-top duration-200
          "
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`
                  w-full px-4 py-2.5
                  flex items-center justify-between
                  text-left text-sm
                  transition-colors duration-150
                  ${isSelected
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${isFocused ? 'bg-gray-100' : ''}
                  ${isSelected && isFocused ? 'bg-blue-100' : ''}
                `}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * 간단한 정렬 드롭다운 (설명 없는 버전)
 */
export const SimpleSortDropdown: React.FC<SortDropdownProps> = (props) => {
  const simpleOptions = props.options?.map(opt => ({
    ...opt,
    description: undefined
  })) || DEFAULT_SORT_OPTIONS.map(opt => ({
    ...opt,
    description: undefined
  }));

  return <SortDropdown {...props} options={simpleOptions} />;
};

export default SortDropdown;