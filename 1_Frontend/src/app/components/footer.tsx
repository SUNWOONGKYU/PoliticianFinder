import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Footer Links */}
        <div className="flex justify-center items-center space-x-8 text-base py-4">
          <Link href="/services" className="text-white hover:text-gray-100 transition font-medium">서비스 소개</Link>
          <Link href="/terms" className="text-white hover:text-gray-100 transition font-medium">이용약관</Link>
          <Link href="/privacy" className="text-white hover:text-gray-100 transition font-medium">개인정보처리방침</Link>
          <Link href="/support" className="text-white hover:text-gray-100 transition font-medium">고객센터</Link>
        </div>
        {/* Copyright */}
        <div className="text-center text-base text-white py-4">
          <p>&copy; 2025 PoliticianFinder. All rights reserved.</p>
          <Link href="/admin/login" className="text-xs text-gray-300 hover:text-white opacity-50 hover:opacity-100 transition">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
