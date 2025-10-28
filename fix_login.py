#!/usr/bin/env python3
# -*- coding: utf-8 -*-

login_content = """'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { MFAVerification } from '@/components/auth/MFAVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const authErrorParam = searchParams.get('error');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
      if (isMockMode) {
        router.push("/");
      }
    }
  }, [router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const result = await signInWithEmail(formData.email, formData.password);

      if (result.requiresMFA) {
        setMfaFactorId(result.factorId || '');
        setShowMFAVerification(true);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      try {
        await login(formData.email, formData.password);
        router.push('/');
      } catch (backendErr: any) {
        console.error('Login failed:', backendErr);
        setAuthError(backendErr.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login failed:', err);
      setAuthError('Google login failed. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMFASuccess = () => {
    setShowMFAVerification(false);
    router.push('/');
  };

  const handleMFACancel = () => {
    setShowMFAVerification(false);
    setMfaFactorId('');
  };

  if (showMFAVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <MFAVerification
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
          factorId={mfaFactorId}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            AI 기반 정치인 평가 플랫폼<br />
            FinderWorld에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authErrorParam === 'auth_failed' && (
            <Alert variant="destructive">
              <AlertDescription>
                로그인에 실패했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}

          {(error || authError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error || authError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm"
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  비밀번호 찾기
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className={validationErrors.password ? 'border-red-500' : ''}
              />
              {validationErrors.password && (
                <p className="text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-2 font-semibold"
              style={{ backgroundColor: 'var(--color-brand-primary)', color: '#000000' }}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '이메일로 로그인'}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 font-semibold border-2"
            style={{
              backgroundColor: 'white',
              color: '#000000',
              borderColor: 'var(--color-brand-primary)'
            }}
            disabled={isLoading}
          >
            Google로 계속하기
          </Button>

          <div className="text-center text-sm text-gray-600 pt-2">
            계정이 없으신가요?
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              회원가입
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
"""

with open("C:/PoliticianFinder/frontend/src/app/login/page.tsx", "w", encoding="utf-8") as f:
    f.write(login_content)

print("Login page fixed!")
