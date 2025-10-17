/**
 * 정치인 상세 페이지 테스트
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TestPoliticianDetailPage() {
  // 테스트용 정치인 ID 목록
  const testPoliticianIds = [1, 2, 3, 4, 5, 10, 15, 20]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">정치인 상세 페이지 테스트</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">기능 테스트</h2>
        <p className="text-gray-600 mb-4">
          아래 정치인 ID를 클릭하여 상세 페이지를 테스트하세요.
        </p>

        <div className="grid grid-cols-4 gap-4">
          {testPoliticianIds.map((id) => (
            <Link key={id} href={`/politicians/${id}`}>
              <Button variant="outline" className="w-full">
                정치인 #{id}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">테스트 시나리오</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-2">
          <li>정치인 기본 정보 표시 확인</li>
          <li>평균 평점 및 평가 개수 표시 확인</li>
          <li>평가 분포 차트 확인</li>
          <li>시민 평가 목록 로딩 확인</li>
          <li>평가 정렬 기능 테스트 (최신순, 평점순)</li>
          <li>평가하기 버튼 동작 확인</li>
          <li>404 에러 페이지 확인 (존재하지 않는 ID)</li>
          <li>무한 스크롤 또는 페이지네이션 동작</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  )
}