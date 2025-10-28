/**
 * useRatings Hook
 * 평가 관련 API 호출을 위한 React Hook
 */

import { useState, useCallback } from 'react'
import type {
  CreateRatingRequest,
  UpdateRatingRequest,
  Rating,
  RatingWithProfile,
  RatingWithPolitician,
  RatingStatistics,
  PaginatedResponse
} from '@/types/database'

/**
 * API 응답 타입
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 평가 API 훅 옵션
 */
interface UseRatingsOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

/**
 * useRatings Hook
 * 평가 CRUD 작업을 위한 커스텀 훅
 */
export function useRatings(options?: UseRatingsOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * API 호출 래퍼 함수
   */
  const apiCall = useCallback(async <T = any>(
    url: string,
    method: string = 'GET',
    body?: any
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)
      const data: ApiResponse<T> = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '요청 처리에 실패했습니다.')
      }

      options?.onSuccess?.(data.data)
      return data.data || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      options?.onError?.(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [options])

  /**
   * 평가 생성
   */
  const createRating = useCallback(async (
    ratingData: CreateRatingRequest
  ): Promise<Rating | null> => {
    return apiCall<Rating>('/api/ratings', 'POST', ratingData)
  }, [apiCall])

  /**
   * 평가 목록 조회
   */
  const getRatings = useCallback(async (
    politicianId: number,
    page: number = 1,
    limit: number = 10,
    category?: string,
    sort?: string
  ): Promise<PaginatedResponse<RatingWithProfile> | null> => {
    const params = new URLSearchParams({
      politician_id: politicianId.toString(),
      page: page.toString(),
      limit: limit.toString(),
    })

    if (category) params.append('category', category)
    if (sort) params.append('sort', sort)

    return apiCall<PaginatedResponse<RatingWithProfile>>(`/api/ratings?${params}`, 'GET')
  }, [apiCall])

  /**
   * 개별 평가 조회
   */
  const getRating = useCallback(async (
    ratingId: number
  ): Promise<RatingWithProfile | null> => {
    return apiCall<RatingWithProfile>(`/api/ratings/${ratingId}`, 'GET')
  }, [apiCall])

  /**
   * 평가 수정
   */
  const updateRating = useCallback(async (
    ratingId: number,
    updateData: UpdateRatingRequest
  ): Promise<Rating | null> => {
    return apiCall<Rating>(`/api/ratings/${ratingId}`, 'PUT', updateData)
  }, [apiCall])

  /**
   * 평가 삭제
   */
  const deleteRating = useCallback(async (
    ratingId: number
  ): Promise<boolean> => {
    const result = await apiCall(`/api/ratings/${ratingId}`, 'DELETE')
    return result !== null
  }, [apiCall])

  /**
   * 평가 통계 조회
   */
  const getRatingStats = useCallback(async (
    politicianId: number
  ): Promise<RatingStatistics | null> => {
    return apiCall<RatingStatistics>(`/api/ratings/stats?politician_id=${politicianId}`, 'GET')
  }, [apiCall])

  /**
   * 내 평가 목록 조회
   */
  const getMyRatings = useCallback(async (
    page: number = 1,
    limit: number = 10,
    sort?: string
  ): Promise<PaginatedResponse<RatingWithPolitician> | null> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (sort) params.append('sort', sort)

    return apiCall<PaginatedResponse<RatingWithPolitician>>(`/api/ratings/my?${params}`, 'GET')
  }, [apiCall])

  /**
   * 특정 정치인에 대한 내 평가 조회
   */
  const getMyRatingForPolitician = useCallback(async (
    politicianId: number
  ): Promise<RatingWithPolitician | null> => {
    return apiCall<RatingWithPolitician>(`/api/ratings/my?politician_id=${politicianId}`, 'GET')
  }, [apiCall])

  /**
   * 내 모든 평가 삭제 (위험한 작업)
   */
  const deleteAllMyRatings = useCallback(async (): Promise<boolean> => {
    const confirmed = window.confirm('정말로 모든 평가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!confirmed) return false

    const result = await apiCall('/api/ratings/my', 'DELETE', {
      confirmation: 'DELETE_ALL_MY_RATINGS'
    })
    return result !== null
  }, [apiCall])

  return {
    // States
    loading,
    error,

    // Methods
    createRating,
    getRatings,
    getRating,
    updateRating,
    deleteRating,
    getRatingStats,
    getMyRatings,
    getMyRatingForPolitician,
    deleteAllMyRatings,
  }
}

/**
 * 평가 점수를 별점으로 변환하는 유틸리티 함수
 */
export function scoreToStars(score: number): string {
  const fullStars = Math.floor(score)
  const halfStar = score % 1 >= 0.5 ? 1 : 0
  const emptyStars = 5 - fullStars - halfStar

  return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}

/**
 * 평균 평점을 텍스트로 변환하는 유틸리티 함수
 */
export function ratingToText(rating: number): string {
  if (rating >= 4.5) return '매우 좋음'
  if (rating >= 3.5) return '좋음'
  if (rating >= 2.5) return '보통'
  if (rating >= 1.5) return '나쁨'
  if (rating > 0) return '매우 나쁨'
  return '평가 없음'
}

/**
 * 카테고리 이름을 한글로 변환하는 유틸리티 함수
 */
export function categoryToKorean(category: string): string {
  const categoryMap: { [key: string]: string } = {
    overall: '전체',
    policy: '정책',
    integrity: '청렴도',
    communication: '소통'
  }
  return categoryMap[category] || category
}