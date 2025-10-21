'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SortValue, SortOption, DEFAULT_SORT_OPTIONS, SortDropdownProps } from '@/types/sort'

/**
 * SortDropdown Component
 *
 * Custom dropdown component for sorting politicians list
 * Features:
 * - Custom dropdown design (replaces native select)
 * - Current selection display
 * - Open/close animations
 * - Click outside to close
 * - Keyboard navigation (↑↓ Arrow keys, Enter, Escape, Home, End)
 * - Accessible with ARIA attributes
 * - Responsive design
 * - Disabled state support
 */
export function SortDropdown({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  className = '',
  disabled = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Find current selected option
  const selectedOption = options.find(option => option.value === value) || options[0]

  /**
   * Handle option selection
   */
  const handleSelect = (optionValue: SortValue) => {
    onChange(optionValue)
    setIsOpen(false)
    setFocusedIndex(-1)
    // Return focus to button after selection
    buttonRef.current?.focus()
  }

  /**
   * Toggle dropdown open/close
   */
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        // Set focus to current selected item when opening
        const currentIndex = options.findIndex(opt => opt.value === value)
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          const currentIndex = options.findIndex(opt => opt.value === value)
          setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
        } else if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        buttonRef.current?.focus()
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          const currentIndex = options.findIndex(opt => opt.value === value)
          setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
        } else {
          setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0))
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          const currentIndex = options.findIndex(opt => opt.value === value)
          setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
        } else {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1))
        }
        break

      case 'Home':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(0)
        }
        break

      case 'End':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(options.length - 1)
        }
        break

      default:
        break
    }
  }

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  /**
   * Scroll focused item into view
   */
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const optionElement = dropdownRef.current?.querySelector(
        `[data-option-index="${focusedIndex}"]`
      ) as HTMLElement

      if (optionElement) {
        optionElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [focusedIndex, isOpen])

  return (
    <div
      ref={dropdownRef}
      className={cn('relative inline-block w-full', className)}
    >
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5',
          'text-sm font-medium text-left',
          'bg-white border border-gray-300 rounded-lg shadow-sm',
          'transition-all duration-200 ease-in-out',
          'hover:border-gray-400 hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300',
          isOpen && 'ring-2 ring-blue-500 border-blue-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="sort-dropdown-label"
      >
        <div className="flex-1">
          <span className="text-gray-900">
            {selectedOption.label}
          </span>
          {selectedOption.description && (
            <span className="block text-xs text-gray-500 mt-0.5">
              {selectedOption.description}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-2',
            'bg-white border border-gray-200 rounded-lg shadow-lg',
            'overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="listbox"
          aria-labelledby="sort-dropdown-label"
        >
          <ul className="py-1 max-h-80 overflow-y-auto">
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isFocused = index === focusedIndex

              return (
                <li
                  key={option.value}
                  data-option-index={index}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'px-4 py-2.5 cursor-pointer transition-colors',
                    'flex items-start justify-between gap-2',
                    isFocused && 'bg-blue-50',
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex-1">
                    <div className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    )}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Simple label component for the dropdown
 */
export function SortDropdownLabel({
  htmlFor,
  children,
  className = '',
}: {
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      id="sort-dropdown-label"
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-gray-700 mb-2', className)}
    >
      {children}
    </label>
  )
}

/**
 * Simple Sort Dropdown (without descriptions)
 *
 * 설명이 없는 간단한 버전의 정렬 드롭다운
 */
export function SimpleSortDropdown(props: SortDropdownProps) {
  const simpleOptions = props.options?.map(opt => ({
    ...opt,
    description: undefined
  })) || DEFAULT_SORT_OPTIONS.map(opt => ({
    ...opt,
    description: undefined
  }));

  return <SortDropdown {...props} options={simpleOptions} />;
}
