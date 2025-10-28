'use client'

import { useState, useCallback } from 'react'
import { SearchFilterParams } from '@/types/filter'
import { PoliticiansQueryParams } from '@/types/api.types'

/**
 * Custom hook for managing politician search filters
 *
 * Converts SearchFilterParams to API query parameters and manages filter state
 */
export function usePoliticianFilters() {
  const [filters, setFilters] = useState<SearchFilterParams>({
    sortBy: 'name',
    sortOrder: 'asc',
  })

  /**
   * Convert SearchFilterParams to API query parameters
   */
  const convertToQueryParams = useCallback(
    (filterParams: SearchFilterParams): PoliticiansQueryParams => {
      const queryParams: PoliticiansQueryParams = {
        page: 1,
        limit: 20,
      }

      // Search fields
      if (filterParams.searchName && filterParams.searchName.length >= 2) {
        queryParams.search = filterParams.searchName
      }

      // Multi-select filters
      if (filterParams.parties && filterParams.parties.length > 0) {
        queryParams.party = filterParams.parties.join(',')
      }

      if (filterParams.regions && filterParams.regions.length > 0) {
        queryParams.region = filterParams.regions.join(',')
      }

      if (filterParams.positions && filterParams.positions.length > 0) {
        queryParams.position = filterParams.positions.join(',')
      }

      // Sort options
      if (filterParams.sortBy) {
        queryParams.sort = filterParams.sortBy
      }

      if (filterParams.sortOrder) {
        queryParams.order = filterParams.sortOrder
      }

      return queryParams
    },
    []
  )

  /**
   * Update filters and return query parameters
   */
  const updateFilters = useCallback(
    (newFilters: SearchFilterParams): PoliticiansQueryParams => {
      setFilters(newFilters)
      return convertToQueryParams(newFilters)
    },
    [convertToQueryParams]
  )

  /**
   * Reset filters to default state
   */
  const resetFilters = useCallback(() => {
    const defaultFilters: SearchFilterParams = {
      sortBy: 'name',
      sortOrder: 'asc',
    }
    setFilters(defaultFilters)
    return convertToQueryParams(defaultFilters)
  }, [convertToQueryParams])

  /**
   * Build URL search params string
   */
  const buildSearchParamsString = useCallback(
    (filterParams: SearchFilterParams): string => {
      const queryParams = convertToQueryParams(filterParams)
      const searchParams = new URLSearchParams()

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      return searchParams.toString()
    },
    [convertToQueryParams]
  )

  return {
    filters,
    updateFilters,
    resetFilters,
    convertToQueryParams,
    buildSearchParamsString,
  }
}
