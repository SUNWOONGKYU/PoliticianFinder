/**
 * RatingStats Component
 * 평가 통계 및 분포 차트 컴포넌트
 */

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RatingDistribution } from '@/types/politician'
import { Star, TrendingUp } from 'lucide-react'

interface RatingStatsProps {
  distribution: RatingDistribution
  avgRating: number
  totalRatings: number
}

export function RatingStats({ distribution, avgRating, totalRatings }: RatingStatsProps) {
  // 각 평점의 백분율 계산
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0
    return (count / totalRatings) * 100
  }

  // 평점별 데이터 (5점부터 1점까지)
  const ratingData = [
    { score: 5, count: distribution['5'] },
    { score: 4, count: distribution['4'] },
    { score: 3, count: distribution['3'] },
    { score: 2, count: distribution['2'] },
    { score: 1, count: distribution['1'] },
  ]

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            평가 통계
          </CardTitle>
          <div className="text-sm text-gray-600">
            총 {totalRatings.toLocaleString()}개의 평가
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Average Rating Display */}
        <div className="flex items-center justify-center mb-8 pb-6 border-b">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {avgRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(avgRating)
                      ? 'text-yellow-400 fill-current'
                      : i < avgRating
                      ? 'text-yellow-400 fill-current opacity-50'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">평균 평점</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          {ratingData.map(({ score, count }) => {
            const percentage = getPercentage(count)

            return (
              <div key={score} className="flex items-center gap-3">
                {/* Score Label */}
                <div className="flex items-center gap-1 w-16 flex-shrink-0">
                  <span className="text-sm font-medium">{score}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count and Percentage */}
                <div className="w-24 text-right flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">
                    {count.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Statistics */}
        {totalRatings > 0 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {getPercentage(distribution['5'] + distribution['4']).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">긍정 평가</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {getPercentage(distribution['3']).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">보통</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {getPercentage(distribution['2'] + distribution['1']).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">부정 평가</div>
            </div>
          </div>
        )}

        {/* No Ratings Message */}
        {totalRatings === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>아직 평가가 없습니다.</p>
            <p className="text-sm mt-1">첫 번째로 평가해보세요!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
