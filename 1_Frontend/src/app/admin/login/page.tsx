'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: 실제 서버 인증 구현 필요
    // 현재는 임시 비밀번호로 체크 (테스트용)
    if (password === 'admin1234') {
      // 쿠키 설정 (임시 방법)
      document.cookie = 'isAdmin=true; path=/; max-age=3600'; // 1시간
      router.push('/admin');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">관리자 로그인</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              관리자 비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="관리자 비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium"
          >
            로그인
          </button>

          <div className="text-center mt-4">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              메인으로 돌아가기
            </a>
          </div>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>개발용 임시 비밀번호:</strong> admin1234
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            실제 배포 시에는 반드시 실제 인증 시스템으로 교체해야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
