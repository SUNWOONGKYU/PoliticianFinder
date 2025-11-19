'use client';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PoliticianFinder 소개</h1>
          <p className="text-xl text-gray-600">정치인을 찾고, 평가하고, 소통하는 플랫폼</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">우리의 미션</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              PoliticianFinder는 시민과 정치인을 연결하는 투명한 플랫폼입니다.
              정치인에 대한 정보를 쉽게 찾고, 시민들의 의견을 공유하며,
              민주주의 발전에 기여하는 것을 목표로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">주요 기능</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">정치인 검색</h3>
                  <p className="text-gray-600">이름, 정당, 지역구 등으로 정치인을 쉽게 검색하고 프로필을 확인할 수 있습니다.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">커뮤니티</h3>
                  <p className="text-gray-600">정치 관련 의견을 자유롭게 공유하고 다른 시민들과 토론할 수 있습니다.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">평가 시스템</h3>
                  <p className="text-gray-600">정치인의 활동을 평가하고 다른 사용자들의 평가를 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">핵심 가치</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">투명성</h3>
                <p className="text-sm text-gray-600">정치인에 대한 정확하고 투명한 정보 제공</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-gray-900 mb-2">소통</h3>
                <p className="text-sm text-gray-600">시민과 정치인 간의 원활한 소통</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">참여</h3>
                <p className="text-sm text-gray-600">모든 시민의 적극적인 정치 참여 독려</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">연락처</h2>
            <div className="space-y-2 text-gray-700">
              <p>문의사항이 있으시면 언제든지 연락 주세요.</p>
              <p>이메일: contact@politicianfinder.com</p>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-600 mb-6">
            PoliticianFinder와 함께 더 나은 민주주의를 만들어 가세요
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/auth/signup" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
              회원가입
            </a>
            <a href="/politicians" className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-gray-50 font-semibold">
              정치인 찾아보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
