// Task: P4BA20 - 정치인 통합 이메일 인증 시스템
// 정치인 본인 인증 모달 컴포넌트

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Politician {
  id: string;
  name: string;
  party: string;
  position: string;
  verified_email?: string;
}

interface PoliticianSession {
  politician_id: string;
  session_token: string;
  expires_at: string;
}

interface PoliticianAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: PoliticianSession, politician: Politician) => void;
}

export function PoliticianAuthModal({ isOpen, onClose, onSuccess }: PoliticianAuthModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [selectedPoliticianId, setSelectedPoliticianId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10분
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);

  // 정치인 목록 로드
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedPoliticianId('');
      setEmail('');
      setVerificationId('');
      setCode('');
      setError('');
      setCountdown(600);
      setSelectedPolitician(null);

      fetch('/api/politicians?limit=1000')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setPoliticians(data.data);
          }
        })
        .catch(err => {
          console.error('Failed to load politicians:', err);
        });
    }
  }, [isOpen]);

  // 정치인 선택 시 정보 업데이트
  useEffect(() => {
    if (selectedPoliticianId) {
      const politician = politicians.find(p => p.id === selectedPoliticianId);
      setSelectedPolitician(politician || null);
    } else {
      setSelectedPolitician(null);
    }
  }, [selectedPoliticianId, politicians]);

  // 카운트다운
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 인증 코드 발송
  const handleSendCode = useCallback(async () => {
    if (!selectedPoliticianId || !email) {
      setError('정치인과 이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/politicians/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: selectedPoliticianId,
          email: email,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setVerificationId(data.verification_id);
        setStep(2);
        setCountdown(600);
      } else {
        setError(data.error?.message || '인증 코드 발송 실패');
      }
    } catch (err) {
      console.error('Send code error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedPoliticianId, email]);

  // 코드 확인
  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/politicians/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: verificationId,
          code: code,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // localStorage에 세션 저장
        localStorage.setItem('politician_session', JSON.stringify(data.session));

        setStep(3);

        // 1.5초 후 성공 콜백
        setTimeout(() => {
          onSuccess(data.session, data.politician);
        }, 1500);
      } else {
        setError(data.error?.message || '인증 실패');
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [code, verificationId, onSuccess]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (step !== 3) {
      onClose();
    }
  }, [step, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-emerald-800 text-white px-6 py-4">
          <h2 className="text-xl font-bold">정치인 본인 인증</h2>
          <p className="text-emerald-200 text-sm mt-1">
            {step === 1 && '정치인을 선택하고 이메일을 입력하세요'}
            {step === 2 && '이메일로 발송된 인증 코드를 입력하세요'}
            {step === 3 && '인증이 완료되었습니다'}
          </p>
        </div>

        <div className="p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: 정치인 선택 + 이메일 입력 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정치인 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPoliticianId}
                  onChange={(e) => setSelectedPoliticianId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- 본인 이름을 선택하세요 --</option>
                  {politicians.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position}, {p.party})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPolitician && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="font-medium text-emerald-800">{selectedPolitician.name}</p>
                  <p className="text-sm text-emerald-600">
                    {selectedPolitician.position} · {selectedPolitician.party}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  본인이 확인 가능한 이메일을 입력하세요.<br/>
                  이 이메일로 6자리 인증 코드가 발송됩니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={loading || !selectedPoliticianId || !email}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      발송 중...
                    </span>
                  ) : '인증 코드 발송'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 코드 입력 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-gray-600 mb-1">
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
                <p className="text-gray-500 text-sm">으로 인증 코드를 발송했습니다.</p>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-300 rounded-xl p-4 w-56 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="text-center">
                <p className={`text-sm ${countdown < 60 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  유효 시간: {formatTime(countdown)}
                </p>
                {countdown === 0 && (
                  <p className="text-red-500 text-sm mt-1">코드가 만료되었습니다. 다시 발송해주세요.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  코드 재발송
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6 || countdown === 0}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      확인 중...
                    </span>
                  ) : '인증 확인'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 완료 */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl">✅</div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {selectedPolitician?.name}님
                </p>
                <p className="text-lg text-emerald-600 font-medium mt-1">
                  본인 인증이 완료되었습니다!
                </p>
              </div>
              <p className="text-gray-500 text-sm">
                이제 글쓰기, 댓글, 보고서 구매가 가능합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 세션 관련 유틸리티 함수들
export function getPoliticianSession(): PoliticianSession | null {
  if (typeof window === 'undefined') return null;

  const session = localStorage.getItem('politician_session');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function clearPoliticianSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('politician_session');
  }
}

export async function validatePoliticianSession(): Promise<{
  success: boolean;
  valid: boolean;
  politician?: Politician;
  expires_at?: string;
  message?: string;
}> {
  const session = getPoliticianSession();
  if (!session) {
    return { success: true, valid: false, message: '세션 정보가 없습니다.' };
  }

  try {
    const res = await fetch('/api/politicians/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });

    return res.json();
  } catch {
    return { success: false, valid: false, message: '세션 확인 중 오류 발생' };
  }
}
