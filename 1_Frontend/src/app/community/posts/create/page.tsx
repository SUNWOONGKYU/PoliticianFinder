'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface Politician {
  name: string;
  party: string;
  position: string;
}

interface DraftData {
  title: string;
  content: string;
  tags: string;
  politicianTag: string;
  politicianTagDisplay: string;
  savedAt: string;
}

interface SelectedFile {
  file: File;
  name: string;
  size: number;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [politicianSearch, setPoliticianSearch] = useState('');
  const [politicianTag, setPoliticianTag] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [searchResults, setSearchResults] = useState<Politician[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loadingPoliticians, setLoadingPoliticians] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          // Not logged in, redirect to login
          alert('로그인이 필요합니다.');
          router.push('/auth/login?redirect=/community/posts/create');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        alert('로그인이 필요합니다.');
        router.push('/auth/login?redirect=/community/posts/create');
      }
    };

    checkAuth();
  }, [router]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_post_member');
    if (draft) {
      const shouldLoad = window.confirm('임시저장된 글이 있습니다. 불러오시겠습니까?');
      if (shouldLoad) {
        const data: DraftData = JSON.parse(draft);
        setTitle(data.title || '');
        setContent(data.content || '');
        setTags(data.tags || '');
        setPoliticianTag(data.politicianTag || '');
        setPoliticianSearch(data.politicianTagDisplay || '');
      }
    }
  }, []);

  // Handle politician search - API call
  useEffect(() => {
    const query = politicianSearch.trim();

    if (query.length === 0) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    if (query.length < 2) {
      // Require at least 2 characters for search
      return;
    }

    const fetchPoliticians = async () => {
      try {
        setLoadingPoliticians(true);
        const response = await fetch(
          `/api/politicians/search?q=${encodeURIComponent(query)}&type=name&limit=20`
        );
        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to match component interface
          const transformedData: Politician[] = result.data.map((p: any) => ({
            name: p.name,
            party: p.political_party_name || '정당 정보 없음',
            position: p.position_name || '직책 정보 없음',
          }));

          setSearchResults(transformedData);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Failed to fetch politicians:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setLoadingPoliticians(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchPoliticians, 300);
    return () => clearTimeout(timeoutId);
  }, [politicianSearch]);

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

  // Select politician from search
  const selectPolitician = (politician: Politician) => {
    setPoliticianSearch(`${politician.name} (${politician.party}, ${politician.position})`);
    setPoliticianTag(politician.name);
    setShowSearchResults(false);
  };

  // Save draft
  const saveDraft = () => {
    const draft: DraftData = {
      title,
      content,
      tags,
      politicianTag,
      politicianTagDisplay: politicianSearch,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('draft_post_member', JSON.stringify(draft));
    showAlertModal('임시저장되었습니다.');
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showAlertModal('제목과 내용을 입력해주세요.');
      return;
    }

    // In production, this would be an API call
    // const formData = new FormData();
    // formData.append('title', title);
    // formData.append('content', content);
    // formData.append('tags', tags);
    // formData.append('category', 'general');
    // formData.append('politicianTag', politicianTag);
    // selectedFiles.forEach(f => formData.append('files', f.file));

    showAlertModal('게시글이 등록되었습니다!');
    localStorage.removeItem('draft_post_member');

    // Redirect after a short delay
    setTimeout(() => {
      router.push('/community');
    }, 1500);
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#politician-tag-search') && !target.closest('#politician-search-results')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">게시글 작성</h1>
          <p className="text-sm md:text-base text-gray-600">커뮤니티에 새로운 글을 작성해보세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">카테고리</label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="font-medium text-purple-600">💬 회원 자유게시판</span>
            </div>
          </div>

          {/* Politician Tag (Optional) */}
          <div>
            <label htmlFor="politician-tag-search" className="block text-sm font-medium text-gray-900 mb-2">
              정치인 태그 <span className="text-gray-500 text-xs">(선택사항)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="politician-tag-search"
                value={politicianSearch}
                onChange={(e) => setPoliticianSearch(e.target.value)}
                placeholder="정치인 이름 검색..."
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div id="politician-search-results" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingPoliticians ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      검색 중...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">검색 결과가 없습니다</div>
                  ) : (
                    <>
                      {searchResults.map((p, index) => (
                        <div
                          key={index}
                          onClick={() => selectPolitician(p)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-600">{p.party} · {p.position}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              특정 정치인에 대한 글을 작성하시는 경우 검색하여 선택해주세요. 해당 정치인의 프로필 페이지에서도 이 글이 표시됩니다.
            </p>
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
              rows={10}
              placeholder="내용을 입력하세요&#10;&#10;• 타인을 비방하거나 명예를 훼손하는 내용은 삼가주세요.&#10;• 허위 사실을 유포하거나 악의적인 내용은 삭제될 수 있습니다.&#10;• 건전한 토론 문화를 만들어 주세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-base md:rows-15"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-sm text-gray-500 mt-1">최대 5개까지 입력 가능합니다.</p>
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="files" className="block text-sm font-medium text-gray-900 mb-2">
              첨부파일 <span className="text-gray-500">(선택)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition">
              <input
                type="file"
                id="files"
                ref={fileInputRef}
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="files" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="text-purple-600 font-medium">파일 선택</span> 또는 드래그 앤 드롭
                </p>
                <p className="mt-1 text-xs text-gray-500">이미지, PDF, DOC 파일 (최대 10MB)</p>
              </label>
            </div>
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
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

          {/* Buttons - Mobile Optimized */}
          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 min-h-touch border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="flex-1 px-6 py-3 min-h-touch border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 font-medium transition"
            >
              임시저장
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 min-h-touch bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
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
