'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notice {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notices');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setNotices(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching notices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">공지사항을 불러오는 중...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">공지사항이 없습니다</h3>
              <p className="text-gray-600">새로운 공지사항이 등록되면 여기에 표시됩니다.</p>
            </div>
          ) : (
            notices.map((notice, index) => (
              <Link
                key={notice.id}
                href={`/notices/${notice.id}`}
                className={`block hover:bg-gray-50 transition ${index < notices.length - 1 ? 'border-b' : ''}`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded shrink-0">📢 공지</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600">
                        {notice.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {getContentPreview(notice.content)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>운영자</span>
                        <span>{formatDate(notice.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
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
