'use client';

export default function ServiceRelayPage() {
  const services = [
    {
      icon: '⚖️',
      title: '법률자문',
      description: '정치 활동 관련 법률자문 서비스',
      status: '준비 중',
    },
    {
      icon: '💼',
      title: '컨설팅',
      description: '선거 전략, 공약 개발 관련 컨설팅',
      status: '준비 중',
    },
    {
      icon: '🎯',
      title: '홍보',
      description: 'SNS 관리, 미디어 홍보, 브랜딩',
      status: '준비 중',
    },
    {
      icon: '📦',
      title: '기타',
      description: '그 외 다양한 전문 서비스',
      status: '준비 중',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔗 서비스 중개</h1>
          <p className="text-lg text-gray-600">정치인과 시민을 위한 다양한 전문 서비스를 연결해드립니다</p>
        </div>

        {/* Service Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">{service.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h2>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              <div className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                {service.status}
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">곧 만나요!</h3>
          <p className="text-gray-700 mb-4">
            정치인과 시민을 위한 다양한 전문 서비스를 준비 중입니다.<br />
            조금만 기다려주세요!
          </p>
        </div>
      </main>
    </div>
  );
}
