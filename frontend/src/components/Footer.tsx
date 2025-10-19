// Footer Component - 하단 푸터

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <a href="#" className="hover:text-purple-400">
            서비스 소개
          </a>
          <a href="#" className="hover:text-purple-400">
            이용약관
          </a>
          <a href="#" className="hover:text-purple-400">
            개인정보처리방침
          </a>
          <a href="#" className="hover:text-purple-400">
            고객센터
          </a>
        </div>
        <div className="border-t border-gray-800 pt-4 text-center text-[10px] text-gray-500">
          © 2025 PoliticianFinder. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
