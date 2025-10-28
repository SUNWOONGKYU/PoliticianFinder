'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PasswordResetForm } from '@/components/auth/PasswordReset';

function PasswordResetConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PasswordResetForm token={token} />
    </div>
  );
}

export default function PasswordResetConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordResetConfirmContent />
    </Suspense>
  );
}
