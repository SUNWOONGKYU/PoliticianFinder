import { renderHook, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePoliticians, usePolitician } from '../usePoliticians'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))

describe('usePoliticians', () => {
  const mockPush = jest.fn()
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should fetch politicians successfully', async () => {
    const mockData = [
      { id: 1, name: 'Test Politician 1', party: 'Test Party' },
      { id: 2, name: 'Test Politician 2', party: 'Test Party' },
    ]

    mockSupabase.range.mockResolvedValueOnce({
      data: mockData,
      error: null,
      count: 2,
    })

    const { result } = renderHook(() => usePoliticians())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.politicians).toEqual(mockData)
    expect(result.current.totalCount).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error', async () => {
    mockSupabase.range.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
      count: 0,
    })

    const { result } = renderHook(() => usePoliticians())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.politicians).toEqual([])
  })

  it('should apply search filters correctly', async () => {
    const searchParams = new URLSearchParams({
      search: 'test',
      searchParty: 'party',
      searchRegion: 'region',
    })

    ;(useSearchParams as jest.Mock).mockReturnValue(searchParams)

    mockSupabase.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    })

    renderHook(() => usePoliticians())

    await waitFor(() => {
      expect(mockSupabase.ilike).toHaveBeenCalledWith('name', '%test%')
    })
  })

  it('should handle pagination correctly', async () => {
    mockSupabase.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 30,
    })

    const { result } = renderHook(() => usePoliticians())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.totalPages).toBe(3) // 30 items / 12 per page = 3 pages
  })

  it('should update URL when filters change', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    const { result } = renderHook(() => usePoliticians())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.handleFilterChange({
      searchName: 'test',
      sortBy: 'rating',
      sortOrder: 'desc',
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })
})

describe('usePolitician', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should fetch single politician successfully', async () => {
    const mockData = { id: 1, name: 'Test Politician', party: 'Test Party' }

    mockSupabase.single.mockResolvedValueOnce({
      data: mockData,
      error: null,
    })

    const { result } = renderHook(() => usePolitician(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.politician).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error for single politician', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const { result } = renderHook(() => usePolitician(999))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.politician).toBeNull()
  })
})
