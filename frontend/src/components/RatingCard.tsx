/**
 * RatingCard Component
 * 개별 평가 카드 컴포넌트
 */

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { RatingWithProfile } from '@/types/database'
import { Star, User, Calendar } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow, ko } from '@/lib/utils/date'

interface RatingCardProps {
  rating: RatingWithProfile
}

export function RatingCard({ rating }: RatingCardProps) {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      overall: '종합',
      policy: '정책',
      integrity: '청렴도',
      communication: '소통'
    }
    return labels[category] || category
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <div className="flex items-center gap-3">
            {rating.profiles?.avatar_url ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={rating.profiles.avatar_url}
                  alt={rating.profiles.username}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">
                {rating.profiles?.username || '익명'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(rating.created_at)}</span>
                {rating.updated_at !== rating.created_at && (
                  <span className="text-gray-400">(수정됨)</span>
                )}
              </div>
            </div>
          </div>

          {/* Rating Score */}
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-bold text-gray-900">{rating.score}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Category Badge */}
        {rating.category && rating.category !== 'overall' && (
          <div className="inline-block mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {getCategoryLabel(rating.category)}
            </span>
          </div>
        )}

        {/* Comment */}
        {rating.comment && (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {rating.comment}
          </p>
        )}

        {/* No Comment Placeholder */}
        {!rating.comment && (
          <p className="text-gray-400 italic text-sm">
            평가 의견이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
