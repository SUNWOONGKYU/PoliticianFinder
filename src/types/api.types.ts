/**
 * API Types for PoliticianFinder
 *
 * This file contains TypeScript type definitions for API requests and responses
 */

import type { Politician, PoliticalParty } from './database'

/**
 * Query parameters for GET /api/politicians
 */
export interface PoliticiansQueryParams {
  page?: number          // Default: 1
  limit?: number         // Default: 10, Max: 100
  search?: string        // Name search
  party?: string         // Party filter (comma-separated)
  region?: string        // Region/District filter (comma-separated)
  position?: string      // Position filter (comma-separated)
  sort?: string          // Sort field (name, avg_rating, total_ratings, created_at)
  order?: 'asc' | 'desc' // Sort order, default: 'asc'
}

/**
 * Response format for GET /api/politicians
 */
export interface PoliticiansResponse {
  data: Politician[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string
  message?: string
  statusCode?: number
}

/**
 * Valid sort fields for politicians
 */
export type PoliticianSortField =
  | 'name'
  | 'avg_rating'
  | 'total_ratings'
  | 'created_at'

/**
 * Query validation schema
 */
export interface ValidatedQuery {
  page: number
  limit: number
  search: string
  party: string[]
  region: string[]
  position: string[]
  sort: PoliticianSortField
  order: 'asc' | 'desc'
}

/**
 * Supabase query builder options
 */
export interface QueryBuilderOptions extends ValidatedQuery {
  offset: number
}