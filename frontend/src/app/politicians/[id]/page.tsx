/**
 * Politician Detail Page
 * 정치인 상세 정보 및 평가 목록 페이지
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PoliticianProfile } from '@/components/PoliticianProfile'
import { RatingStats } from '@/components/RatingStats'
import { RatingCard } from '@/components/RatingCard'
import { Button } from '@/components/ui/button'
import { PoliticianDetail } from '@/types/politician'
import { RatingWithProfile, PaginatedResponse } from '@/types/database'
import { useRatings } from '@/hooks/useRatings'
import { ArrowLeft, MessageSquare, SortAsc, SortDesc, Filter } from 'lucide-react'
import { mockAdapterApi } from '@/lib/api/mock-adapter'

type SortOption = 'latest' | 'oldest' | 'highest' | 'lowest'

export default function PoliticianDetailPage() {
  const params = useParams()
  const router = useRouter()
  const politicianId = parseInt(params.id as string)

  const [politician, setPolitician] = useState<PoliticianDetail | null>(null)
  const [ratings, setRatings] = useState<RatingWithProfile[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { getRatings, loading: ratingsLoading } = useRatings()

  // 정치인 정보 로드
  useEffect(() => {
    const fetchPolitician = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/politicians/${politicianId}`)

        if (!response.ok) {
          // API 실패 시 Mock 데이터 사용
          const mockPolitician = mockAdapterApi.getPoliticianById(politicianId)
          if (mockPolitician) {
            // Mock 데이터를 PoliticianDetail 형식으로 변환
            const mockDetail: PoliticianDetail = {
              ...mockPolitician,
              rating_distribution: [0, 0, 0, 0, 0],
              avg_rating: mockPolitician.member_rating,
              total_ratings: 0
            }
            setPolitician(mockDetail)
            setLoading(false)
            return
          }
          
          if (response.status === 404) {
            throw new Error('정치인을 찾을 수 없습니다.')
          }
          throw new Error('정치인 정보를 불러오는데 실패했습니다.')
        }

        const data = await response.json()
        setPolitician(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (politicianId && !isNaN(politicianId)) {
      fetchPolitician()
    } else {
      setError('잘못된 정치인 ID입니다.')
      setLoading(false)
    }
  }, [politicianId])
  // 평가 목록 로드
  useEffect(() => {
    const fetchRatings = async () => {
      if (!politicianId || isNaN(politicianId)) return

      const sortMapping: { [key in SortOption]: string } = {
        latest: 'created_at:desc',
        oldest: 'created_at:asc',
        highest: 'score:desc',
        lowest: 'score:asc'
      }

      const result = await getRatings(
        politicianId,
        pagination.page,
        pagination.limit,
        categoryFilter === 'all' ? undefined : categoryFilter,
        sortMapping[sortBy]
      )

      if (result) {
        setRatings(result.data)
        setPagination(result.pagination)
      }
    }

    fetchRatings()
  }, [politicianId, pagination.page, sortBy, categoryFilter, getRatings, pagination.limit])

  // 정렬 옵션 변경
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 카테고리 필터 변경
  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 평가하기 버튼 클릭
  const handleRateClick = () => {
    // TODO: 평가 작성 모달 또는 페이지로 이동
    alert('평가하기 기능은 곧 구현될 예정입니다.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">정치인 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !politician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || '정치인을 찾을 수 없습니다'}
          </h1>
          <p className="text-gray-600 mb-6">
            요청하신 정치인 정보를 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </Button>
        </div>

        {/* Politician Profile */}
        <div className="mb-8">
          <PoliticianProfile politician={politician} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Statistics - Left Column */}
          <div className="lg:col-span-1">
            <RatingStats
              distribution={politician.rating_distribution}
              avgRating={politician.avg_rating}
              totalRatings={politician.total_ratings}
            />
          </div>

          {/* Rating List - Right Column */}
          <div className="lg:col-span-2">
            {/* Rating List Header */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold">
                    시민 평가 ({pagination.total.toLocaleString()})
                  </h2>
                </div>

                {/* Rate Button */}
                <Button onClick={handleRateClick} className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  평가하기
                </Button>
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체 카테고리</option>
                    <option value="overall">종합</option>
                    <option value="policy">정책</option>
                    <option value="integrity">청렴도</option>
                    <option value="communication">소통</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="latest">최신순</option>
                    <option value="oldest">오래된순</option>
                    <option value="highest">평점 높은순</option>
                    <option value="lowest">평점 낮은순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rating Cards */}
            {ratingsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <RatingCard key={rating.id} rating={rating} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">아직 평가가 없습니다.</p>
                <p className="text-sm text-gray-400 mb-6">
                  첫 번째로 평가를 남겨보세요!
                </p>
                <Button onClick={handleRateClick}>평가하기</Button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  이전
                </Button>

                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const page = i + 1
                    // 현재 페이지 주변만 표시
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.page - 1 && page <= pagination.page + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? 'default' : 'outline'}
                          onClick={() => handlePageChange(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      )
                    } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                      return <span key={page} className="px-2">...</span>
                    }
                    return null
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
