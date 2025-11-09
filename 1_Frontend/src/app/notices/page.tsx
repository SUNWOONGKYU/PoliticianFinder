'use client';

import Link from 'next/link';

interface Notice {
  id: number;
  title: string;
  summary: string;
  author: string;
  date: string;
  views: number;
  type: 'important' | 'notice' | 'info' | 'event' | 'maintenance';
}

export default function NoticesPage() {
  const notices: Notice[] = [
    {
      id: 1,
      title: 'PoliticianFinder 정식 오픈!',
      summary: '드디어 AI 기반 정치인 평가 커뮤니티 플랫폼, PoliticianFinder가 정식으로 오픈했습니다.',
      author: '운영자',
      date: '2025.10.28',
      views: 1234,
      type: 'important'
    },
    {
      id: 2,
      title: 'AI 정치인 평가 시스템 업데이트 안내',
      summary: '평가 정확도 향상을 위한 AI 모델 업데이트가 진행되었습니다. 더욱 객관적이고 신뢰할 수 있는 평가를 제공합니다.',
      author: '운영자',
      date: '2025.10.25',
      views: 856,
      type: 'notice'
    },
    {
      id: 3,
      title: '커뮤니티 이용 가이드라인 안내',
      summary: '건강한 토론 문화를 위한 커뮤니티 이용 규칙을 안내드립니다. 모든 회원은 상호 존중을 기본으로 합니다.',
      author: '운영자',
      date: '2025.10.22',
      views: 645,
      type: 'notice'
    },
    {
      id: 4,
      title: '정치인 본인 인증 절차 안내',
      summary: '정치인 회원으로 활동하시려면 본인 인증이 필요합니다. 인증 절차를 안내해드립니다.',
      author: '운영자',
      date: '2025.10.20',
      views: 523,
      type: 'info'
    },
    {
      id: 5,
      title: '회원 등급 및 포인트 제도 안내',
      summary: '활동에 따라 회원 등급과 영향력 등급이 부여됩니다. 등급별 혜택을 확인하세요.',
      author: '운영자',
      date: '2025.10.18',
      views: 789,
      type: 'info'
    },
    {
      id: 6,
      title: '오픈 기념 이벤트 - 추첨을 통해 선물 증정!',
      summary: '정식 오픈을 기념하여 회원 가입 이벤트를 진행합니다. 추첨을 통해 푸짐한 선물을 드립니다.',
      author: '운영자',
      date: '2025.10.15',
      views: 1456,
      type: 'event'
    },
    {
      id: 7,
      title: '정기 서버 점검 안내 (10월 12일)',
      summary: '안정적인 서비스 제공을 위한 정기 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 제한됩니다.',
      author: '운영자',
      date: '2025.10.10',
      views: 432,
      type: 'maintenance'
    },
    {
      id: 8,
      title: '개인정보 처리방침 업데이트 안내',
      summary: '회원님의 개인정보 보호를 위해 개인정보 처리방침이 일부 변경되었습니다.',
      author: '운영자',
      date: '2025.10.08',
      views: 567,
      type: 'info'
    }
  ];

  const getNoticeTypeBadge = (type: Notice['type']) => {
    switch (type) {
      case 'important':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded shrink-0">📢 중요</span>;
      case 'notice':
        return <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded shrink-0">📢 공지</span>;
      case 'info':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded shrink-0">📝 안내</span>;
      case 'event':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded shrink-0">🎉 이벤트</span>;
      case 'maintenance':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded shrink-0">🔧 점검</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항</h1>
          <p className="text-gray-600">PoliticianFinder의 새로운 소식과 안내사항을 확인하세요.</p>
        </div>

        {/* Notices List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {notices.map((notice, index) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className={`block hover:bg-gray-50 transition ${index < notices.length - 1 ? 'border-b' : ''}`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  {getNoticeTypeBadge(notice.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {notice.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{notice.author}</span>
                      <span>{notice.date}</span>
                      <span>조회 {notice.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px">
            <button className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              이전
            </button>
            <button className="px-4 py-2 border border-gray-300 bg-primary-500 text-sm font-medium text-white">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              다음
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}
