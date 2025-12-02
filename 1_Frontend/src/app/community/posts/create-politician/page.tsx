'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface Politician {
  id: string;
  name: string;
  political_party_name: string;
  position_name: string;
  verified_email: string | null;
}

export default function CreatePoliticianPostPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'auth' | 'write'>('select');

  // Politician selection
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);
  const [loadingPoliticians, setLoadingPoliticians] = useState(true);

  // Email authentication
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Post writing
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Alert
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Load politicians on mount
  useEffect(() => {
    loadPoliticians();
  }, []);

  const loadPoliticians = async () => {
    try {
      const response = await fetch('/api/politicians?limit=1000');
      const data = await response.json();

      if (response.ok && data.success) {
        setPoliticians(data.data);
      } else {
        showAlertModal('정치인 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load politicians:', error);
      showAlertModal('정치인 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingPoliticians(false);
    }
  };

  // Handle politician selection
  const handlePoliticianSelect = (politician: Politician) => {
    setSelectedPolitician(politician);

    // Check localStorage session
    const sessionKey = `politician_${politician.id}`;
    const session = localStorage.getItem(sessionKey);

    if (session) {
      // Session exists → go directly to writing
      setStep('write');
    } else {
      // No session → need authentication
      setStep('auth');
    }
  };

  // Send verification code
  const handleSendCode = async () => {
    if (!email.trim()) {
      showAlertModal('이메일을 입력해주세요.');
      return;
    }

    if (!selectedPolitician) {
      showAlertModal('정치인을 선택해주세요.');
      return;
    }

    setSendingCode(true);

    try {
      const response = await fetch('/api/politicians/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: selectedPolitician.id,
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCodeSent(true);
        showAlertModal('인증 코드가 이메일로 발송되었습니다.');
      } else {
        showAlertModal(data.message || '인증 코드 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send code:', error);
      showAlertModal('인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setSendingCode(false);
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showAlertModal('인증 코드를 입력해주세요.');
      return;
    }

    if (!selectedPolitician) {
      showAlertModal('정치인을 선택해주세요.');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch('/api/politicians/verify/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: selectedPolitician.id,
          email: email.trim(),
          code: verificationCode.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save session to localStorage
        const sessionKey = `politician_${selectedPolitician.id}`;
        const sessionToken = data.session_token || Date.now().toString();
        localStorage.setItem(sessionKey, sessionToken);

        showAlertModal('인증이 완료되었습니다!');

        // Go to writing step
        setTimeout(() => {
          setStep('write');
        }, 1000);
      } else {
        showAlertModal(data.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      showAlertModal('인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  // Submit post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPolitician) {
      showAlertModal('정치인을 선택해주세요.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      showAlertModal('제목과 내용을 입력해주세요.');
      return;
    }

    // Get session token from localStorage
    const sessionKey = `politician_${selectedPolitician.id}`;
    const sessionToken = localStorage.getItem(sessionKey);

    if (!sessionToken) {
      showAlertModal('세션이 만료되었습니다. 다시 인증해주세요.');
      setStep('auth');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: selectedPolitician.id,
          session_token: sessionToken,
          subject: title.trim(),  // ← "title" 아님, "subject"
          content: content.trim(),
          category: 'general',
          author_type: 'politician',
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : []
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlertModal('게시글이 등록되었습니다!');

        setTimeout(() => {
          router.push('/community');
        }, 1500);
      } else {
        showAlertModal(data.message || data.error?.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      showAlertModal('게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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

  // Loading state
  if (loadingPoliticians) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정치인 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Step 1: Politician Selection
  if (step === 'select') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">정치인 선택</h1>
            <p className="text-gray-600">글을 작성할 정치인을 선택해주세요.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="정치인 이름 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => {
                  const search = e.target.value.toLowerCase();
                  if (!search) {
                    loadPoliticians();
                  } else {
                    setPoliticians(prev =>
                      prev.filter(p => p.name.toLowerCase().includes(search))
                    );
                  }
                }}
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        {politician.position_name} · {politician.political_party_name}
                      </p>
                      {politician.verified_email && (
                        <p className="text-xs text-green-600 mt-1">✓ 이메일 인증됨</p>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
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

  // Step 2: Email Authentication
  if (step === 'auth' && selectedPolitician) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">이메일 인증</h1>
            <p className="text-gray-600">{selectedPolitician.name} 정치인으로 글을 작성하려면 이메일 인증이 필요합니다.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Selected Politician */}
            <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
              <h3 className="font-bold text-gray-900">{selectedPolitician.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPolitician.position_name} · {selectedPolitician.political_party_name}
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                이메일 주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                disabled={codeSent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
              {selectedPolitician.verified_email && (
                <p className="text-sm text-gray-500 mt-1">
                  ℹ️ 이 정치인은 등록된 이메일로만 인증 가능합니다.
                </p>
              )}
            </div>

            {/* Send Code Button */}
            {!codeSent && (
              <button
                onClick={handleSendCode}
                disabled={sendingCode || !email.trim()}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {sendingCode ? '발송 중...' : '인증 코드 발송'}
              </button>
            )}

            {/* Verification Code Input */}
            {codeSent && (
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-900 mb-2">
                    인증 코드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6자리 인증 코드"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    이메일로 발송된 6자리 인증 코드를 입력하세요.
                  </p>
                </div>

                <button
                  onClick={handleVerifyCode}
                  disabled={verifying || !verificationCode.trim()}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {verifying ? '인증 중...' : '인증 확인'}
                </button>

                <button
                  onClick={() => {
                    setCodeSent(false);
                    setVerificationCode('');
                  }}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  다시 발송
                </button>
              </>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setSelectedPolitician(null);
                setStep('select');
                setEmail('');
                setVerificationCode('');
                setCodeSent(false);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Step 3: Write Post
  if (step === 'write' && selectedPolitician) {
    return (
      <div className="bg-gray-50 min-h-screen">
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
                    {selectedPolitician.position_name} · {selectedPolitician.political_party_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolitician(null);
                    setStep('select');
                  }}
                  className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-100 rounded-lg transition"
                >
                  변경
                </button>
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
                placeholder="내용을 입력하세요"
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
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <>
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">잘못된 페이지 상태입니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            돌아가기
          </button>
        </div>
      </div>

      {/* Alert Modal (shared across all steps) */}
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
    </>
  );
}
