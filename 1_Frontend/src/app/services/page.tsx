'use client';

import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary-600 p-8 text-center text-white">
            <h1 className="text-4xl font-bold">"훌륭한 정치인을 찾아드립니다"</h1>
            <p className="mt-4 text-lg text-primary-100">AI 기반 정치인 평가 커뮤니티 플랫폼, PoliticianFinder</p>
          </div>

          <div className="p-8 md:p-12 space-y-16">
            {/* 1. AI 기반 객관적 평가 */}
            <section className="bg-white rounded-lg shadow-lg p-8">
              <span className="text-primary-500 font-semibold">Core Feature 01</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">AI 기반 객관적 평가</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                PoliticianFinder는 정치에 대한 막연한 인상과 감정적인 판단을 넘어, 데이터에 기반한 객관적인 평가점수와 평가내역을 제공합니다.
              </p>
              <p className="text-gray-600 leading-relaxed mb-3">
                5개의 서로 다른 AI 모델(Claude, ChatGPT, Gemini, Grok, Perplexity)이 청렴성, 전문성, 소통능력, 정책능력, 리더십, 책임성, 투명성, 혁신성, 포용성, 효율성 등 10개 분야를 평가합니다. 각 분야는 7개 항목으로 세분화되어 총 70개 항목을 통해 정치인을 다각도로 분석합니다.
              </p>
              <p className="text-gray-600 leading-relaxed">
                1,000점 만점 체계로 정량화된 평가 결과를 제공하며, 다중 AI 시스템을 통해 편향을 최소화하고 신뢰도 높은 평가를 보장합니다.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>다중 AI 모델을 통한 교차 검증</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>10개 분야, 각 7개씩 총 70개 항목으로 평가</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>평가 기준 및 데이터 출처 투명성 확보</span>
                </li>
              </ul>
            </section>

            {/* 2. 시민 참여 커뮤니티 */}
            <section className="bg-white rounded-lg shadow-lg p-8">
              <span className="text-primary-500 font-semibold">Core Feature 02</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">시민이 만드는 정치 커뮤니티</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                AI의 평가는 시작일 뿐입니다. PoliticianFinder의 진짜 핵심은 시민 여러분의 참여에 있습니다.
              </p>
              <p className="text-gray-600 leading-relaxed">
                자유로운 토론이 가능한 커뮤니티에서 특정 정치인이나 정책에 대한 의견을 나누고, 다른 사람들의 생각을 듣고 교류하며 집단지성을 형성해보세요. 댓글과 공감 시스템을 통해 함께 건강한 정치 토론 문화를 만들어갑니다.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>최신순, 공감순, 조회순 정렬 기능</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>정치인 게시판과 자유게시판 분리 운영</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>공감/비공감으로 의견 표현</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>고객센터를 통한 신고 및 관리</span>
                </li>
              </ul>
            </section>

            {/* 3. 정치인과 직접 소통 */}
            <section className="bg-white rounded-lg shadow-lg p-8">
              <span className="text-primary-500 font-semibold">Core Feature 03</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">정치인과 유권자의 직접 소통</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                언론이나 SNS를 통한 간접 소통이 아닌, 정치인과 시민이 직접 만나는 공간입니다.
              </p>
              <p className="text-gray-600 leading-relaxed mb-3">
                등록된 정치인은 자신의 이름으로 직접 게시글을 작성하고, 시민들의 의견에 댓글로 답하며 소통합니다. 유권자는 궁금한 점을 직접 질문하고 답변을 받을 수 있습니다.
              </p>
              <p className="text-gray-600 leading-relaxed">
                정치인은 지역구 주민들의 생생한 목소리를 가장 가까이에서 듣고, 시민은 정치인의 진솔한 답변을 직접 확인할 수 있습니다.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>등록된 정치인의 직접 참여 및 소통</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>정치인 게시판 전용 카테고리 운영</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>시민과 정치인의 투명한 질의응답</span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <Link
            href="/politicians"
            className="inline-block px-8 py-4 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 transition-colors"
          >
            정치인 평가 보러가기
          </Link>
        </div>
      </main>
    </div>
  );
}
