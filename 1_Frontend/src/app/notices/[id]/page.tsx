'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Notice {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const noticeId = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setLoading(true);
        // Fetch notice by ID from API
        const response = await fetch(`/api/notices/${noticeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('공지사항을 찾을 수 없습니다.');
          }
          throw new Error('공지사항을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setNotice(data.data);
        } else {
          throw new Error(data.error || '공지사항을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Error fetching notice:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (noticeId) {
      fetchNotice();
    }
  }, [noticeId]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/notices" className="inline-flex items-center text-gray-600 hover:text-primary-600">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
              </svg>
              공지사항 목록
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">공지사항을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">{error || '요청하신 공지사항이 존재하지 않습니다.'}</p>
            <Link
              href="/notices"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              공지사항 목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/notices" className="inline-flex items-center text-gray-600 hover:text-primary-600">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
            </svg>
            공지사항 목록
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded">
              📢 공지사항
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{notice.title}</h1>

          <div className="border-b pb-4 mb-6 text-sm text-gray-500">
            <span>작성자: <span className="font-semibold text-gray-800">관리자</span></span>
            <span className="mx-2">|</span>
            <span>게시일: {formatDate(notice.created_at)}</span>
            {notice.updated_at !== notice.created_at && (
              <>
                <span className="mx-2">|</span>
                <span>수정일: {formatDate(notice.updated_at)}</span>
              </>
            )}
          </div>

          <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {notice.content}
          </div>
        </article>

        <div className="text-center">
          <Link
            href="/notices"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
