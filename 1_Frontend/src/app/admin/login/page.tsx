'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['wksun999@gmail.com'];

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 로그인된 사용자 확인 및 관리자 이메일이면 자동 로그인
  useEffect(() => {
    const checkUserAndAutoLogin = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email) {
          setUserEmail(user.email);

          // 관리자 이메일인 경우 자동으로 어드민 접속
          if (ADMIN_EMAILS.includes(user.email)) {
            document.cookie = 'isAdmin=true; path=/; max-age=3600'; // 1시간
            router.push('/admin');
            return;
          }
        }
      } catch (error) {
        console.error('Auto login check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndAutoLogin();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 관리자 비밀번호로 로그인
    if (password === 'admin1234') {
      document.cookie = 'isAdmin=true; path=/; max-age=3600'; // 1시간
      router.push('/admin');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">관리자 로그인</h1>

        {/* 관리자 이메일 안내 */}
        {userEmail && ADMIN_EMAILS.includes(userEmail) && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              관리자 계정으로 로그인되어 있습니다. 자동 접속 중...
            </p>
          </div>
        )}

        {/* 일반 사용자 안내 */}
        {userEmail && !ADMIN_EMAILS.includes(userEmail) && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              현재 <strong>{userEmail}</strong>으로 로그인 중입니다.
              관리자 권한이 없으므로 비밀번호를 입력해주세요.
            </p>
          </div>
        )}

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
