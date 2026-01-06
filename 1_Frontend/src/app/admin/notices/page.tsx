'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../components/AdminSidebar';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notices');
      const result = await response.json();

      if (result.success) {
        setNotices(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        setNotices(notices.filter(n => n.id !== id));
        alert('삭제되었습니다.');
      } else {
        alert(result.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
            <Link
              href="/admin/notices/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              + 새 공지사항
            </Link>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 w-24">중요</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 w-40">작성일</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 w-32">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        등록된 공지사항이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    notices.map((notice) => (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{notice.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {notice.content.substring(0, 100)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {notice.is_important ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              중요
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {formatDate(notice.created_at)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
