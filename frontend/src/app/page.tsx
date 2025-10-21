'use client';

import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            훌륭한 정치인 찾기
          </h1>
          <p className="text-xl font-semibold text-blue-600 mb-8">
            AI 기반 정치인 평가 플랫폼
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">서비스 현황</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900">정치인 수</p>
                <p className="text-3xl font-bold text-blue-600">30명</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-900">평가 시스템</p>
                <p className="text-lg font-bold text-green-600">모의 데이터</p>
              </div>
            </div>

            <div className="text-left space-y-3 mb-8">
              <h3 className="font-bold text-lg">포함된 기능:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>한글 정치인 데이터 (30명)</li>
                <li>신분 분류: 출마자, 예비후보자, 후보자, 당선자, 현직</li>
                <li>직종 분류: 특별시장, 광역시장, 도지사, 시장, 구청장, 군수, 광역의원, 기초의원</li>
                <li>회원 평점 시스템</li>
                <li>인기 게시글 (15개)</li>
              </ul>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              새로고침
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
