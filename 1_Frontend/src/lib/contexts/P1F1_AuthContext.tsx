/**
 * Project Grid Task ID: P1F1
 * 작업명: 전역 레이아웃 (AuthContext 생성)
 * 생성시간: 2025-11-01
 * 생성자: Gemini
 * 의존성: P1BI1
 * 설명: 애플리케이션 전체에서 사용자 인증 상태를 관리하고 공유하기 위한 React Context와 Provider를 정의합니다.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient, getCurrentSession, getCurrentUser } from '@/lib/supabase/client'; // Supabase 클라이언트 임포트
import type { User, Session } from '@supabase/supabase-js';

// 컨텍스트 데이터 타입 정의
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: any | null;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const supabase = getSupabaseClient(); // Supabase 클라이언트 초기화

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const currentSession = await getCurrentSession();
        setSession(currentSession);

        const currentUser = await getCurrentUser();
        setUser(currentUser);

      } catch (e) {
        console.error('Error fetching auth session:', e);
        setError(e);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Supabase onAuthStateChange 리스너 설정
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined;
    if (supabase) {
      authListener = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });
    }

    // 클린업 함수
    return () => {
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
