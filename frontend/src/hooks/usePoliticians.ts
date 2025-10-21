'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Politician } from '@/types/database'
import type { SearchFilterParams } from '@/types/filter'
import type { SortValue } from '@/types/sort'
import { mockAdapterApi } from '@/lib/api/mock-adapter'

// Use mock data for development
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

/**
 * Custom hook for fetching and managing politicians list
 * Handles API calls, pagination, filtering, and URL sync
 */
export function usePoliticians() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // State management
  const [politicians, setPoliticians] = useState<Politician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Fixed 12 items per page for grid layout

  // Parse URL parameters
  const getInitialFilters = (): SearchFilterParams => {
    const params: SearchFilterParams = {}

    // Search parameters
    const searchName = searchParams.get('search')
    const searchParty = searchParams.get('searchParty')
    const searchRegion = searchParams.get('searchRegion')

    if (searchName) params.searchName = searchName
    if (searchParty) params.searchParty = searchParty
    if (searchRegion) params.searchRegion = searchRegion

    // Filter arrays
    const parties = searchParams.get('parties')
    const regions = searchParams.get('regions')
    const positions = searchParams.get('positions')

    if (parties) params.parties = parties.split(',')
    if (regions) params.regions = regions.split(',')
    if (positions) params.positions = positions.split(',')

    // Election count filter
    const minElectionCount = searchParams.get('minElectionCount')
    if (minElectionCount) params.minElectionCount = parseInt(minElectionCount)

    // Sort parameters
    const sortBy = searchParams.get('sortBy') as any
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc'

    params.sortBy = sortBy || 'name'
    params.sortOrder = sortOrder || 'asc'

    return params
  }

  const [filters, setFilters] = useState<SearchFilterParams>(getInitialFilters())

  /**
   * Fetch politicians from Mock Data or API
   */
  const fetchPoliticians = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use mock data for development
      if (USE_MOCK_DATA) {
        console.log('[DEV] Using mock data for politicians list')
        const mockData = mockAdapterApi.getPoliticiansWithFiltering(filters, currentPage, itemsPerPage)
        setPoliticians(mockData.data)
        setTotalCount(mockData.total)
        return
      }

      // Build Supabase query
      let query = supabase
        .from('politicians')
        .select('*', { count: 'exact' })

      // Apply search filters
      if (filters.searchName && filters.searchName.length >= 2) {
        query = query.ilike('name', `%${filters.searchName}%`)
      }

      if (filters.searchParty && filters.searchParty.length >= 2) {
        query = query.ilike('party', `%${filters.searchParty}%`)
      }

      if (filters.searchRegion && filters.searchRegion.length >= 2) {
        query = query.ilike('district', `%${filters.searchRegion}%`)
      }

      // Apply array filters
      if (filters.parties && filters.parties.length > 0) {
        query = query.in('party', filters.parties)
      }

      if (filters.regions && filters.regions.length > 0) {
        // Handle region filtering based on district field
        const regionQueries = filters.regions.map(region => `district.ilike.%${region}%`)
        query = query.or(regionQueries.join(','))
      }

      if (filters.positions && filters.positions.length > 0) {
        query = query.in('position', filters.positions)
      }

      // Apply minimum election count filter (assuming it relates to rating count)
      if (filters.minElectionCount) {
        query = query.gte('total_ratings', filters.minElectionCount * 100) // Approximate threshold
      }

      // Apply sorting
      const sortColumn = mapSortValueToColumn(filters.sortBy || 'name')
      const ascending = filters.sortOrder === 'asc'

      query = query.order(sortColumn, { ascending })

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      query = query.range(from, to)

      // Execute query
      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setPoliticians(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching politicians:', err)
      setError(err instanceof Error ? err.message : '정치인 목록을 불러오는데 실패했습니다.')
      setPoliticians([])
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, itemsPerPage, supabase])

  /**
   * Map sort value to database column
   */
  const mapSortValueToColumn = (sortValue: string): string => {
    switch (sortValue) {
      case 'name':
        return 'name'
      case 'rating':
        return 'avg_rating'
      case 'popularity':
        return 'total_ratings'
      case 'recent':
        return 'created_at'
      case 'electionCount':
        return 'total_ratings' // Using ratings as proxy
      default:
        return 'name'
    }
  }

  /**
   * Update URL with current filters
   */
  const updateURL = useCallback((newFilters: SearchFilterParams, page: number) => {
    const params = new URLSearchParams()

    // Add search parameters
    if (newFilters.searchName) params.set('search', newFilters.searchName)
    if (newFilters.searchParty) params.set('searchParty', newFilters.searchParty)
    if (newFilters.searchRegion) params.set('searchRegion', newFilters.searchRegion)

    // Add filter arrays
    if (newFilters.parties?.length) params.set('parties', newFilters.parties.join(','))
    if (newFilters.regions?.length) params.set('regions', newFilters.regions.join(','))
    if (newFilters.positions?.length) params.set('positions', newFilters.positions.join(','))

    // Add election count
    if (newFilters.minElectionCount) params.set('minElectionCount', newFilters.minElectionCount.toString())

    // Add sort parameters
    if (newFilters.sortBy !== 'name') params.set('sortBy', newFilters.sortBy!)
    if (newFilters.sortOrder !== 'asc') params.set('sortOrder', newFilters.sortOrder!)

    // Add page
    if (page > 1) params.set('page', page.toString())

    const queryString = params.toString()
    const url = queryString ? `/politicians?${queryString}` : '/politicians'

    router.push(url)
  }, [router])

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((newFilters: SearchFilterParams) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page on filter change
    updateURL(newFilters, 1)
  }, [updateURL])

  /**
   * Handle page changes
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateURL(filters, page)

    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, updateURL])

  /**
   * Handle sort changes from SortDropdown
   */
  const handleSortChange = useCallback((sortValue: SortValue) => {
    // Parse the sort value (e.g., "name-desc" or "rating")
    let sortBy: string
    let sortOrder: 'asc' | 'desc' = 'asc'

    if (sortValue.endsWith('-desc')) {
      sortBy = sortValue.replace('-desc', '')
      sortOrder = 'desc'
    } else {
      sortBy = sortValue
    }

    const newFilters = { ...filters, sortBy: sortBy as any, sortOrder }
    handleFilterChange(newFilters)
  }, [filters, handleFilterChange])

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    const newFilters: SearchFilterParams = {
      sortBy: 'name',
      sortOrder: 'asc'
    }
    handleFilterChange(newFilters)
  }, [handleFilterChange])

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchName ||
      filters.searchParty ||
      filters.searchRegion ||
      filters.parties?.length ||
      filters.regions?.length ||
      filters.positions?.length ||
      filters.minElectionCount ||
      (filters.sortBy && filters.sortBy !== 'name') ||
      (filters.sortOrder && filters.sortOrder !== 'asc')
    )
  }, [filters])

  /**
   * Calculate pagination values
   */
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchPoliticians()
  }, [fetchPoliticians])

  // Update page from URL on mount
  useEffect(() => {
    const pageParam = searchParams.get('page')
    if (pageParam) {
      const page = parseInt(pageParam)
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page)
      }
    }
  }, [searchParams])

  return {
    // Data
    politicians,
    loading,
    error,
    totalCount,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,

    // Filters
    filters,
    hasActiveFilters,

    // Actions
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
    refetch: fetchPoliticians
  }
}

/**
 * Hook for fetching a single politician by ID
 */
export function usePolitician(id: number) {
  const [politician, setPolitician] = useState<Politician | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchPolitician = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use mock data for development
        if (USE_MOCK_DATA) {
          console.log('[DEV] Using mock data for politician detail:', id)
          const mockData = mockAdapterApi.getPoliticianById(id)
          setPolitician(mockData as any)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('politicians')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        setPolitician(data)
      } catch (err) {
        console.error('Error fetching politician:', err)
        setError(err instanceof Error ? err.message : '정치인 정보를 불러오는데 실패했습니다.')
        setPolitician(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPolitician()
    }
  }, [id, supabase])

  return { politician, loading, error }
}
