'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postUserId, setPostUserId] = useState<string | null>(null);

  // Check authentication and load post data
  useEffect(() => {
    const init = async () => {
      try {
        // 1. 인증 확인
        const authResponse = await fetch('/api/auth/me');
        if (!authResponse.ok) {
          alert('로그인이 필요합니다.');
          router.push(`/auth/login?redirect=/community/posts/${params.id}/edit`);
          return;
        }

        const authResult = await authResponse.json();
        if (authResult.success && authResult.user) {
          setCurrentUserId(authResult.user.id);
        }

        // 2. 게시글 데이터 불러오기
        const postResponse = await fetch(`/api/posts/${params.id}`);
        if (!postResponse.ok) {
          showAlertModal('게시글을 찾을 수 없습니다.');
          setTimeout(() => router.push('/community'), 1500);
          return;
        }

        const postResult = await postResponse.json();
        if (postResult.success && postResult.data) {
          const postData = postResult.data;
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setPostUserId(postData.user_id);

          // 3. 작성자 본인 확인
          if (authResult.user?.id !== postData.user_id) {
            showAlertModal('게시글 수정 권한이 없습니다.');
            setTimeout(() => router.push(`/community/posts/${params.id}`), 1500);
            return;
          }
        }
      } catch (error) {
        console.error('Init error:', error);
        showAlertModal('오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [params.id, router]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showAlertModal('제목과 내용을 입력해주세요.');
      return;
    }

    if (title.trim().length < 5) {
      showAlertModal('제목은 최소 5자 이상이어야 합니다.');
      return;
    }

    if (content.trim().length < 10) {
      showAlertModal('내용은 최소 10자 이상이어야 합니다.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showAlertModal(result.error?.message || '게시글 수정에 실패했습니다.');
        return;
      }

      showAlertModal('게시글이 수정되었습니다!');

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/community/posts/${params.id}`);
      }, 1500);
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      showAlertModal('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Alert modal functions
  const showAlertModal = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlertModal = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-500 text-lg mt-4">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">게시글 수정</h1>
          <p className="text-sm md:text-base text-gray-600">게시글 내용을 수정합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="제목을 입력하세요 (최대 100자)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            />
            <div className="text-right mt-1">
              <span className="text-sm text-gray-500">{title.length} / 100</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              placeholder="내용을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-base"
            />
            <div className="text-right mt-1">
              <span className="text-sm text-gray-500">{content.length}자</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  수정 중...
                </>
              ) : (
                '수정하기'
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={closeAlertModal}
                className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
