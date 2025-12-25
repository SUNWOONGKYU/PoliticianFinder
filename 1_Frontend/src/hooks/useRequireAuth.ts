/**
 * Project Grid Task ID: P7F1
 * 작업명: 페이지 레벨 인증 보호 구현
 * 생성시간: 2025-12-18
 * 생성자: frontend-developer
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * 페이지 레벨 인증 보호 훅
 *
 * @description
 * 인증이 필요한 페이지에서 사용하는 커스텀 훅
 * - 세션이 없으면 자동으로 로그인 페이지로 리다이렉트
 * - 로그인 후 원래 페이지로 돌아올 수 있도록 redirect 파라미터 전달
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const { user, loading, isAuthenticated } = useRequireAuth();
 *
 *   if (loading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   // user는 이 시점에서 항상 존재함 (리다이렉트되지 않았다면)
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export function useRequireAuth(): UseRequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const supabase = createClient();

        // 현재 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session) {
          // 인증되지 않은 경우 로그인 페이지로 리다이렉트
          const redirectUrl = encodeURIComponent(pathname);
          router.replace(`/auth/login?redirect=${redirectUrl}`);
          return;
        }

        // 인증된 경우
        setUser(session.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          // 에러 발생 시에도 로그인 페이지로 리다이렉트
          const redirectUrl = encodeURIComponent(pathname);
          router.replace(`/auth/login?redirect=${redirectUrl}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    // 실시간 인증 상태 변경 감지
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          // 로그아웃되면 로그인 페이지로 리다이렉트
          const redirectUrl = encodeURIComponent(pathname);
          router.replace(`/auth/login?redirect=${redirectUrl}`);
        } else if (event === 'SIGNED_IN' && session) {
          // 로그인되면 사용자 정보 업데이트
          setUser(session.user);
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return { user, loading, isAuthenticated };
}
