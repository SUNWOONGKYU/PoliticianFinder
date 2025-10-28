'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Politician } from '@/types/database';

/**
 * PoliticianCard 컴포넌트 Props
 */
export interface PoliticianCardProps {
  politician: Politician;
  onClick?: () => void;
  className?: string;
}

/**
 * PoliticianCard 컴포넌트
 * 정치인 정보를 카드 형태로 표시
 *
 * @features
 * - 프로필 이미지
 * - 이름, 정당, 지역구
 * - 평균 평점 및 평가 수
 * - 호버 효과
 * - 클릭 가능
 */
export function PoliticianCard({
  politician,
  onClick,
  className,
}: PoliticianCardProps) {
  const {
    name,
    party,
    district,
    position,
    profile_image_url,
    avg_rating,
    total_ratings,
  } = politician;

  // 평점을 별 개수로 변환
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-4 h-4 fill-yellow-400 text-yellow-400"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400 text-yellow-400"
          style={{
            clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
          }}
        />
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-0">
        {/* 프로필 이미지 */}
        <div className="relative w-full h-48 bg-gray-200">
          {profile_image_url ? (
            <Image
              src={profile_image_url}
              alt={`${name} 프로필`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
              <span className="text-4xl font-bold text-white">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* 이름 및 직급 */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-600">{position}</p>
        </div>

        {/* 정당 및 지역구 */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{party}</span>
          </div>
          {district && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{district}</span>
            </div>
          )}
        </div>

        {/* 평점 */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              {renderStars(avg_rating || 0)}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {avg_rating ? avg_rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {total_ratings ? `${total_ratings.toLocaleString()}개 평가` : '평가 없음'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
