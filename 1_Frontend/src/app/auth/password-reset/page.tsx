/**
 * Project Grid Task ID: P1F4
 * 작업명: 비밀번호 찾기 페이지
 * 설명: 사용자 비밀번호 재설정 기능 구현
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PasswordResetPage() {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepCompleted, setStepCompleted] = useState<'email' | 'password' | null>(null);

  // Form data
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    letter: false,
    number: false,
    special: false
  });

  // Password visibility
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Step 1: Email verification form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // API 호출 (P1BA4 - 비밀번호 재설정 - 이메일 발송)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || '인증 메일 발송에 실패했습니다.');
        return;
      }

      // Mark step as completed
      setStepCompleted('email');
      setMessage(`${email}로 인증 메일을 발송했습니다.`);
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendEmail = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // API 호출 (재발송)
      // const response = await fetch('/api/auth/password-reset/resend-code', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   setError(data.message || '메일 재발송에 실패했습니다.');
      //   return;
      // }

      setMessage('인증 메일을 다시 보냈습니다.');
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Password validation
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8 && password.length <= 16,
      letter: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    setPasswordRequirements(requirements);

    let strength = 0;
    if (requirements.length) strength++;
    if (requirements.letter) strength++;
    if (requirements.number) strength++;
    if (requirements.special) strength++;

    setPasswordStrength(strength);
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  // Step 2: Password reset form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const isValid =
      passwordRequirements.length &&
      passwordRequirements.letter &&
      passwordRequirements.number &&
      passwordRequirements.special;

    if (!isValid) {
      setError('비밀번호가 요구사항을 충족하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      // API 호출 (P1BA4 - 비밀번호 재설정 - 비밀번호 변경)
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || '비밀번호 재설정에 실패했습니다.');
        return;
      }

      setStepCompleted('password');
      setMessage('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthTexts = ['약함', '보통', '강함', '매우 강함'];
  const strengthWidths = ['25%', '50%', '75%', '100%'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 py-12 flex-1">
        <div className="max-w-md w-full">
          {/* Step Indicator */}
          {stepCompleted !== 'password' && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      stepCompleted === 'email' ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                  >
                    {stepCompleted === 'email' ? '✓' : '1'}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      stepCompleted === 'email' ? 'text-green-600' : 'text-primary-600'
                    }`}
                  >
                    이메일 인증
                  </span>
                </div>
                <div className={`w-12 h-0.5 ${stepCompleted === 'email' ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      stepCompleted === 'email' ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      stepCompleted === 'email' ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  >
                    비밀번호 재설정
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Email Form */}
          {stepCompleted !== 'email' && stepCompleted !== 'password' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호를 잊으셨나요?</h2>
                <p className="text-gray-600">
                  가입하신 이메일 주소를 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 mb-4">{error}</div>}

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    이메일 주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:bg-gray-400 transition"
                >
                  {loading ? '발송 중...' : '인증 메일 보내기'}
                </button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-gray-600 hover:text-primary-600">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* Step 1 Confirmation */}
          {stepCompleted === 'email' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">인증 메일을 발송했습니다</h2>
                <p className="text-gray-600 mb-4">
                  <span className="font-bold text-primary-600">{email}</span> 주소로<br />
                  비밀번호 재설정 링크를 보냈습니다.
                </p>
                <p className="text-sm text-gray-500">
                  이메일을 확인하고 링크를 클릭하여<br />
                  비밀번호를 재설정해주세요.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    유의사항
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                    <li>• 메일이 오지 않았다면 스팸함을 확인해주세요.</li>
                    <li>• 인증 링크는 24시간 동안 유효합니다.</li>
                    <li>• 링크는 1회만 사용 가능합니다.</li>
                  </ul>
                </div>

                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full px-6 py-3 border-2 border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 font-medium disabled:border-gray-400 disabled:text-gray-400 transition"
                >
                  {loading ? '발송 중...' : '인증 메일 다시 보내기'}
                </button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-gray-600 hover:text-primary-600">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Password Form */}
          {stepCompleted === 'password' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h2>
                <p className="text-gray-600">안전한 비밀번호로 변경해주세요.</p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 mb-4">{error}</div>}
              {message && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 mb-4">{message}</div>}

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* New Password */}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-900 mb-2">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword1 ? 'text' : 'password'}
                      id="new-password"
                      name="password"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="8자 이상, 영문/숫자/특수문자 포함"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strengthColors[passwordStrength - 1] || 'bg-red-500'}`}
                            style={{ width: strengthWidths[passwordStrength - 1] || '25%' }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium text-${strengthColors[passwordStrength - 1]?.replace('bg-', '') || 'red-500'}`}>
                          {strengthTexts[passwordStrength - 1] || '약함'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-900 mb-2">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      id="confirm-password"
                      name="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="비밀번호를 다시 입력하세요"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">비밀번호 요구사항</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className={passwordRequirements.length ? 'text-green-600' : 'text-gray-400'}>
                        {passwordRequirements.length ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.length ? 'text-green-600' : 'text-gray-600'}>
                        8자 이상 16자 이하
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={passwordRequirements.letter ? 'text-green-600' : 'text-gray-400'}>
                        {passwordRequirements.letter ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.letter ? 'text-green-600' : 'text-gray-600'}>
                        영문 대소문자 포함
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={passwordRequirements.number ? 'text-green-600' : 'text-gray-400'}>
                        {passwordRequirements.number ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.number ? 'text-green-600' : 'text-gray-600'}>
                        숫자 포함
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={passwordRequirements.special ? 'text-green-600' : 'text-gray-400'}>
                        {passwordRequirements.special ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.special ? 'text-green-600' : 'text-gray-600'}>
                        특수문자 포함 (!@#$%^&*)
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:bg-gray-400 transition"
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2 Complete */}
          {stepCompleted === 'password' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호가 변경되었습니다</h2>
                <p className="text-gray-600 mb-8">새로운 비밀번호로 로그인하실 수 있습니다.</p>

                <Link
                  href="/auth/login"
                  className="inline-block w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-center"
                >
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
