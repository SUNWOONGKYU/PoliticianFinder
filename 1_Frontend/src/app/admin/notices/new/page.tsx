'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';

export default function NewNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('공지사항이 등록되었습니다.');
        router.push('/admin/notices');
      } else {
        setError(result.error || '공지사항 등록에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">새 공지사항 작성</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="공지사항 내용을 입력하세요"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg font-medium ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              >
                {loading ? '등록 중...' : '공지사항 등록'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
