'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['wksun999@gmail.com'];

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
            setIsAdmin(true);
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

  // 일반 로그인 페이지로 이동
  const handleGoToLogin = () => {
    router.push('/auth/login?redirect=/admin/login');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">관리자 페이지</h1>

        {/* 관리자 이메일로 로그인 중 - 자동 접속 */}
        {isAdmin && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              관리자 계정으로 로그인되어 있습니다. 자동 접속 중...
            </p>
          </div>
        )}

        {/* 로그인되어 있지만 관리자 아님 */}
        {userEmail && !isAdmin && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">⛔ 접근 권한이 없습니다</p>
              <p className="text-sm text-red-700">
                현재 <strong>{userEmail}</strong>으로 로그인 중입니다.
              </p>
              <p className="text-sm text-red-700 mt-1">
                관리자 권한이 있는 계정으로 로그인해주세요.
              </p>
            </div>

            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium"
            >
              다른 계정으로 로그인
            </button>
          </div>
        )}

        {/* 로그인되어 있지 않음 */}
        {!userEmail && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                관리자 페이지에 접근하려면 관리자 계정으로 로그인해야 합니다.
              </p>
            </div>

            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium"
            >
              로그인하기
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
