'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface Politician {
  id: string;
  name: string;
  party: string;
  position: string;
  is_verified: boolean;
  verified_at: string | null;
  verification_id: string;
}

interface DraftData {
  title: string;
  content: string;
  tags: string;
  selectedPoliticianId: string;
  savedAt: string;
}

interface SelectedFile {
  file: File;
  name: string;
  size: number;
}

export default function CreatePoliticianPostPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Politician selection state
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);
  const [loadingPoliticians, setLoadingPoliticians] = useState(true);
  const [showPoliticianSelector, setShowPoliticianSelector] = useState(false);

  // Check authentication and load verified politicians on mount
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check authentication
        const authResponse = await fetch('/api/auth/me');
        if (!authResponse.ok) {
          alert('로그인이 필요합니다.');
          router.push('/auth/login?redirect=/community/posts/create-politician');
          return;
        }

        // 2. Load user's verified politicians
        const politiciansResponse = await fetch('/api/politicians/verification/my-politicians');
        const politiciansData = await politiciansResponse.json();

        if (!politiciansResponse.ok) {
          console.error('Failed to load politicians:', politiciansData);
          showAlertModal(politiciansData.message || '인증된 정치인 정보를 불러올 수 없습니다.');
          setLoadingPoliticians(false);
          return;
        }

        if (politiciansData.success && politiciansData.data) {
          setPoliticians(politiciansData.data);

          // If only one politician, auto-select
          if (politiciansData.data.length === 1) {
            setSelectedPolitician(politiciansData.data[0]);
          } else if (politiciansData.data.length > 1) {
            // Show politician selector if multiple politicians
            setShowPoliticianSelector(true);
          } else {
            // No verified politicians
            showAlertModal('인증된 정치인이 없습니다. 먼저 정치인 인증을 완료해주세요.');
            setTimeout(() => {
              router.push('/politicians');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        showAlertModal('페이지를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingPoliticians(false);
      }
    };

    init();
  }, [router]);

  // Load draft on component mount
  useEffect(() => {
    if (!selectedPolitician) return;

    const draft = localStorage.getItem('draft_post_politician');
    if (draft) {
      const shouldLoad = window.confirm('임시저장된 글이 있습니다. 불러오시겠습니까?');
      if (shouldLoad) {
        const data: DraftData = JSON.parse(draft);
        setTitle(data.title || '');
        setContent(data.content || '');
        setTags(data.tags || '');

        // Check if draft's politician matches current selected politician
        if (data.selectedPoliticianId !== selectedPolitician.id) {
          showAlertModal('임시저장된 글의 정치인과 현재 선택된 정치인이 다릅니다.');
        }
      }
    }
  }, [selectedPolitician]);

  // Handle politician selection
  const handlePoliticianSelect = (politician: Politician) => {
    setSelectedPolitician(politician);
    setShowPoliticianSelector(false);
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: file.size
      }));
      setSelectedFiles(files);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save draft
  const saveDraft = () => {
    if (!selectedPolitician) {
      showAlertModal('정치인을 선택해주세요.');
      return;
    }

    const draft: DraftData = {
      title,
      content,
      tags,
      selectedPoliticianId: selectedPolitician.id,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('draft_post_politician', JSON.stringify(draft));
    showAlertModal('임시저장되었습니다.');
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedPolitician) {
      showAlertModal('정치인을 선택해주세요.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      showAlertModal('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      // Create post via API
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: 'politician',
          politician_id: selectedPolitician.id,
          author_type: 'politician',
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : []
        })
      });

      const result = await response.json();

      if (!response.ok) {
        showAlertModal(result.message || '게시글 등록에 실패했습니다.');
        return;
      }

      showAlertModal('게시글이 등록되었습니다!');
      localStorage.removeItem('draft_post_politician');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/community');
      }, 1500);
    } catch (error) {
      console.error('Post creation error:', error);
      showAlertModal('게시글 등록 중 오류가 발생했습니다.');
    }
  };

  // Alert modal functions
  const showAlertModal = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAlertModal = () => {
    setShowAlert(false);
    setAlertMessage('');
    document.body.style.overflow = 'auto';
  };

  // Loading state
  if (loadingPoliticians) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증된 정치인 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Politician selector modal
  if (showPoliticianSelector && politicians.length > 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">정치인 선택</h1>
            <p className="text-gray-600">글을 작성할 정치인을 선택해주세요.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {politicians.map((politician) => (
              <button
                key={politician.id}
                onClick={() => handlePoliticianSelect(politician)}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{politician.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {politician.position} · {politician.party}
                    </p>
                    {politician.is_verified && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ 인증됨
                        </span>
                      </div>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No politician selected state
  if (!selectedPolitician) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">인증된 정치인이 없습니다.</p>
          <Link
            href="/politicians"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            정치인 인증하기
          </Link>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">정치인 게시글 작성</h1>
          <p className="text-gray-600">커뮤니티에 새로운 글을 작성해보세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Selected Politician Display */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">작성자 (정치인)</label>
            <div className="flex items-center justify-between p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
              <div>
                <h3 className="font-bold text-gray-900">{selectedPolitician.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPolitician.position} · {selectedPolitician.party}
                </p>
              </div>
              {politicians.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowPoliticianSelector(true)}
                  className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-100 rounded-lg transition"
                >
                  변경
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">카테고리</label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="font-medium text-primary-600">🏛️ 정치인 게시판</span>
            </div>
          </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              placeholder="내용을 입력하세요&#10;&#10;• 타인을 비방하거나 명예를 훼손하는 내용은 삼가주세요.&#10;• 허위 사실을 유포하거나 악의적인 내용은 삭제될 수 있습니다.&#10;• 건전한 토론 문화를 만들어 주세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <div className="text-right mt-1">
              <span className="text-sm text-gray-500">{content.length}자</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-2">
              태그 <span className="text-gray-500">(선택)</span>
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그를 쉼표(,)로 구분하여 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">최대 5개까지 입력 가능합니다.</p>
          </div>

          {/* Writing Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              작성 가이드
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-7">
              <li>• 구체적이고 명확한 제목을 작성해주세요.</li>
              <li>• 근거 있는 정보를 바탕으로 작성해주세요.</li>
              <li>• 타인을 존중하는 언어를 사용해주세요.</li>
              <li>• 개인정보 유출에 주의해주세요.</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="flex-1 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-purple-50 font-medium"
            >
              임시저장
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              등록하기
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
