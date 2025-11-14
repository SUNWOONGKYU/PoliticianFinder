// P3BA27: 서비스 중개 페이지 (relay)
'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RelayService {
  id: number;
  category: string;
  title: string;
  description: string;
  features: string[];
  provider: string;
  priceRange: string;
  icon: string;
}

export default function RelayPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const services: RelayService[] = [
    {
      id: 1,
      category: '법률',
      title: '정치 활동 법률자문',
      description: '선거법, 정치자금법 등 정치 활동 관련 전문 법률자문 서비스를 제공합니다.',
      features: ['선거법 컨설팅', '정치자금법 자문', '공직선거법 검토', '법적 리스크 관리'],
      provider: '법무법인 정치',
      priceRange: '협의',
      icon: '⚖️'
    },
    {
      id: 2,
      category: '컨설팅',
      title: '선거 전략 컨설팅',
      description: '당선 가능성을 높이는 전략적 선거 컨설팅을 제공합니다.',
      features: ['선거구 분석', '여론조사', '전략 수립', '캠페인 기획'],
      provider: '정치전략연구소',
      priceRange: '500만원~',
      icon: '💼'
    },
    {
      id: 3,
      category: '컨설팅',
      title: '공약 개발 서비스',
      description: '지역 특성과 유권자 니즈를 반영한 실현 가능한 공약을 개발합니다.',
      features: ['지역 현안 분석', '공약 개발', '실현가능성 검토', '홍보 자료 제작'],
      provider: '공약연구원',
      priceRange: '300만원~',
      icon: '📋'
    },
    {
      id: 4,
      category: '홍보',
      title: 'SNS 관리 대행',
      description: '정치인 SNS 채널을 전문적으로 관리하고 운영합니다.',
      features: ['콘텐츠 기획', '일정 관리', '댓글 모니터링', '분석 리포트'],
      provider: 'SNS전문기획사',
      priceRange: '월 200만원~',
      icon: '📱'
    },
    {
      id: 5,
      category: '홍보',
      title: '미디어 홍보 서비스',
      description: '언론 보도자료 작성 및 배포, 미디어 관계 관리를 지원합니다.',
      features: ['보도자료 작성', '기자간담회 기획', '미디어 트레이닝', '위기관리'],
      provider: 'PR컴퍼니',
      priceRange: '월 300만원~',
      icon: '📺'
    },
    {
      id: 6,
      category: '홍보',
      title: '브랜딩 & 디자인',
      description: '정치인 개인 브랜드를 구축하고 시각적 아이덴티티를 개발합니다.',
      features: ['브랜드 컨셉 개발', '로고 디자인', '홍보물 제작', 'CI/BI 구축'],
      provider: '브랜딩스튜디오',
      priceRange: '500만원~',
      icon: '🎨'
    },
    {
      id: 7,
      category: '기술',
      title: '홈페이지 제작',
      description: '정치인 공식 홈페이지 제작 및 유지보수 서비스입니다.',
      features: ['반응형 웹 제작', 'CMS 구축', 'SEO 최적화', '보안 관리'],
      provider: '웹에이전시',
      priceRange: '300만원~',
      icon: '💻'
    },
    {
      id: 8,
      category: '교육',
      title: '미디어 트레이닝',
      description: '방송 출연 및 언론 인터뷰 대응을 위한 전문 트레이닝을 제공합니다.',
      features: ['카메라 앞 말하기', '인터뷰 스킬', '위기대응 연습', '스피치 코칭'],
      provider: '미디어트레이닝센터',
      priceRange: '100만원~',
      icon: '🎥'
    }
  ];

  const categories = ['all', '법률', '컨설팅', '홍보', '기술', '교육'];
  const categoryLabels: Record<string, string> = {
    'all': '전체',
    '법률': '⚖️ 법률',
    '컨설팅': '💼 컨설팅',
    '홍보': '🎯 홍보',
    '기술': '💻 기술',
    '교육': '🎥 교육'
  };

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔗 서비스 중개</h1>
          <p className="text-gray-600">
            정치 활동에 필요한 전문 서비스를 연결해드립니다. 법률, 컨설팅, 홍보 등 다양한 분야의 전문가와 함께하세요.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{service.icon}</div>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded">
                  {service.category}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">주요 서비스</h4>
                <ul className="space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-primary-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">제공업체</div>
                  <div className="text-sm font-medium text-gray-900">{service.provider}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">가격</div>
                  <div className="text-sm font-bold text-primary-600">{service.priceRange}</div>
                </div>
              </div>

              <button className="mt-4 w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 font-medium transition">
                문의하기
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">해당 카테고리에 서비스가 없습니다.</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">서비스 이용 안내</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">1. 서비스 선택</h3>
              <p className="text-sm">필요한 서비스를 선택하고 "문의하기" 버튼을 클릭하세요.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. 상담 신청</h3>
              <p className="text-sm">전문가와 1:1 상담을 통해 구체적인 내용을 협의합니다.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. 계약 및 진행</h3>
              <p className="text-sm">계약 체결 후 전문 서비스를 제공받으세요.</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 유의사항:</span>
              모든 서비스는 제공업체와 직접 계약하며, PoliticianFinder는 중개 역할만 수행합니다.
              서비스 내용 및 가격은 제공업체와 협의하여 결정됩니다.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
