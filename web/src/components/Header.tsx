// Header Component - 상단 네비게이션

export function Header() {
  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* 좌측: 브랜드명 */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-primary">PoliticianFinder</span>
          </div>

          {/* 우측: 네비게이션 메뉴 */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <a href="#" className="text-gray-700 hover:text-brand-primary">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-brand-primary">
              정치인 목록
            </a>
            <a href="#" className="text-gray-700 hover:text-brand-primary">
              커뮤니티
            </a>
            <a href="#" className="text-gray-700 hover:text-brand-primary">
              검색
            </a>
            <a href="#" className="text-gray-600 hover:text-brand-primary text-xs">
              로그인
            </a>
            <a href="#" className="bg-brand-primary hover:bg-brand-dark text-white px-3 py-1.5 rounded text-xs font-medium">
              회원가입
            </a>
            <button className="relative p-1 text-gray-700 hover:text-brand-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
