/**
 * PoliticianProfile Component
 * 정치인 프로필 카드 컴포넌트
 */

import React from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PoliticianDetail } from '@/types/politician'
import { User, MapPin, Briefcase, Globe, Calendar } from 'lucide-react'

interface PoliticianProfileProps {
  politician: PoliticianDetail
}

export function PoliticianProfile({ politician }: PoliticianProfileProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
              {politician.profile_image_url ? (
                <Image
                  src={politician.profile_image_url}
                  alt={politician.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <CardTitle className="text-3xl mb-2">{politician.name}</CardTitle>

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span className="font-medium">{politician.party}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{politician.region}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{politician.position}</span>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(politician.avg_rating)
                          ? 'text-yellow-400 fill-current'
                          : i < politician.avg_rating
                          ? 'text-yellow-400 fill-current opacity-50'
                          : 'text-gray-300'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {politician.avg_rating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-600">
                ({politician.total_ratings.toLocaleString()}개의 평가)
              </span>
            </div>

            {/* External Links */}
            {politician.official_website && (
              <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <Globe className="w-4 h-4" />
                <a
                  href={politician.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  공식 웹사이트
                </a>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Biography */}
        {politician.biography && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">약력</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {politician.biography}
            </p>
          </div>
        )}

        {/* AI Scores */}
        {politician.ai_scores && Object.keys(politician.ai_scores).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">AI 평가 점수</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(politician.ai_scores).map(([ai, score]) => (
                score && (
                  <div key={ai} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1 capitalize">{ai}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {score.toFixed(1)}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>등록일: {formatDate(politician.created_at)}</span>
          </div>
          {politician.total_posts > 0 && (
            <div>
              <span className="font-medium">관련 게시글:</span> {politician.total_posts}개
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
