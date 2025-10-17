import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SortDropdown, SortDropdownLabel } from './SortDropdown'
import { SortValue, DEFAULT_SORT_OPTIONS } from '@/types/sort'

const meta = {
  title: 'Components/Common/SortDropdown',
  component: SortDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: DEFAULT_SORT_OPTIONS.map(opt => opt.value),
      description: 'Current selected sort value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the dropdown',
    },
  },
} satisfies Meta<typeof SortDropdown>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive wrapper component for Storybook
 */
function InteractiveSortDropdown(props: any) {
  const [sortValue, setSortValue] = useState<SortValue>(props.value || 'rating_desc')

  return (
    <div className="w-80">
      <SortDropdownLabel>정렬 방식</SortDropdownLabel>
      <SortDropdown
        {...props}
        value={sortValue}
        onChange={setSortValue}
      />
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Selected value:</p>
        <p className="text-sm font-mono font-bold text-gray-900">{sortValue}</p>
      </div>
    </div>
  )
}

/**
 * Default story - Interactive dropdown
 */
export const Default: Story = {
  render: (args) => <InteractiveSortDropdown {...args} />,
  args: {
    value: 'rating_desc',
    options: DEFAULT_SORT_OPTIONS,
    disabled: false,
  },
}

/**
 * All sort options
 */
export const AllOptions: Story = {
  render: () => {
    const [sortValue, setSortValue] = useState<SortValue>('rating_desc')

    return (
      <div className="w-80 space-y-4">
        <div>
          <SortDropdownLabel>전체 정렬 옵션</SortDropdownLabel>
          <SortDropdown
            value={sortValue}
            onChange={setSortValue}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-sm font-medium text-gray-700">사용 가능한 옵션:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {DEFAULT_SORT_OPTIONS.map(opt => (
              <li key={opt.value} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="font-medium">{opt.label}</span>
                <span className="text-gray-500">- {opt.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  },
}

/**
 * Custom options - Subset of options
 */
export const CustomOptions: Story = {
  render: () => {
    const [sortValue, setSortValue] = useState<SortValue>('rating_desc')
    const customOptions = DEFAULT_SORT_OPTIONS.filter(opt =>
      ['rating_desc', 'rating_asc', 'name_asc'].includes(opt.value)
    )

    return (
      <div className="w-80">
        <SortDropdownLabel>커스텀 옵션 (일부만 표시)</SortDropdownLabel>
        <SortDropdown
          value={sortValue}
          onChange={setSortValue}
          options={customOptions}
        />
      </div>
    )
  },
}

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <SortDropdownLabel>비활성화된 드롭다운</SortDropdownLabel>
      <SortDropdown
        value="rating_desc"
        onChange={() => {}}
        options={DEFAULT_SORT_OPTIONS}
        disabled={true}
      />
      <p className="mt-2 text-sm text-gray-500">
        비활성화된 상태에서는 클릭할 수 없습니다.
      </p>
    </div>
  ),
}

/**
 * With custom styling
 */
export const CustomStyling: Story = {
  render: () => {
    const [sortValue, setSortValue] = useState<SortValue>('rating_desc')

    return (
      <div className="w-80">
        <SortDropdownLabel>커스텀 스타일링</SortDropdownLabel>
        <SortDropdown
          value={sortValue}
          onChange={setSortValue}
          options={DEFAULT_SORT_OPTIONS}
          className="border-2 border-blue-500 rounded-xl"
        />
      </div>
    )
  },
}

/**
 * Multiple dropdowns demonstration
 */
export const MultipleDropdowns: Story = {
  render: () => {
    const [primarySort, setPrimarySort] = useState<SortValue>('rating_desc')
    const [secondarySort, setSecondarySort] = useState<SortValue>('name_asc')

    return (
      <div className="w-80 space-y-6">
        <div>
          <SortDropdownLabel>주 정렬</SortDropdownLabel>
          <SortDropdown
            value={primarySort}
            onChange={setPrimarySort}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>

        <div>
          <SortDropdownLabel>보조 정렬</SortDropdownLabel>
          <SortDropdown
            value={secondarySort}
            onChange={setSecondarySort}
            options={DEFAULT_SORT_OPTIONS.filter(opt => opt.value !== primarySort)}
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-1">
          <p className="text-sm font-medium text-gray-700">선택된 정렬:</p>
          <p className="text-sm text-gray-600">
            주: <span className="font-medium">{primarySort}</span>
          </p>
          <p className="text-sm text-gray-600">
            보조: <span className="font-medium">{secondarySort}</span>
          </p>
        </div>
      </div>
    )
  },
}

/**
 * Responsive demonstration
 */
export const Responsive: Story = {
  render: () => {
    const [sortValue, setSortValue] = useState<SortValue>('rating_desc')

    return (
      <div className="space-y-4">
        <div className="w-full max-w-xs">
          <SortDropdownLabel>모바일 (320px)</SortDropdownLabel>
          <SortDropdown
            value={sortValue}
            onChange={setSortValue}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>

        <div className="w-full max-w-md">
          <SortDropdownLabel>태블릿 (768px)</SortDropdownLabel>
          <SortDropdown
            value={sortValue}
            onChange={setSortValue}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>

        <div className="w-full max-w-2xl">
          <SortDropdownLabel>데스크톱 (1024px+)</SortDropdownLabel>
          <SortDropdown
            value={sortValue}
            onChange={setSortValue}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'padded',
  },
}

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const [sortValue, setSortValue] = useState<SortValue>('rating_desc')

    return (
      <div className="w-80 space-y-4">
        <div>
          <SortDropdownLabel>키보드 네비게이션 테스트</SortDropdownLabel>
          <SortDropdown
            value={sortValue}
            onChange={setSortValue}
            options={DEFAULT_SORT_OPTIONS}
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">키보드 단축키:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><kbd className="px-2 py-1 bg-white rounded text-xs">Enter</kbd> 또는 <kbd className="px-2 py-1 bg-white rounded text-xs">Space</kbd> - 드롭다운 열기/선택</li>
            <li><kbd className="px-2 py-1 bg-white rounded text-xs">↑</kbd> <kbd className="px-2 py-1 bg-white rounded text-xs">↓</kbd> - 옵션 이동</li>
            <li><kbd className="px-2 py-1 bg-white rounded text-xs">Esc</kbd> - 드롭다운 닫기</li>
            <li><kbd className="px-2 py-1 bg-white rounded text-xs">Home</kbd> - 첫 번째 옵션으로</li>
            <li><kbd className="px-2 py-1 bg-white rounded text-xs">End</kbd> - 마지막 옵션으로</li>
          </ul>
        </div>
      </div>
    )
  },
}
