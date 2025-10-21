'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MFAVerification } from '@/components/auth/MFAVerification';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MFAVerifyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [factorId, setFactorId] = useState<string>('');

  useEffect(() => {
    checkMFARequirement();
  }, [user]);

  const checkMFARequirement = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const assuranceLevel = await supabase.auth.mfa.getAuthenticatorAssuranceLevels();

    // If MFA is not required or already completed, redirect to home
    if (!assuranceLevel || assuranceLevel.currentLevel === 'aal2') {
      router.push('/');
      return;
    }

    // Get the factor ID for verification
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') || [];

    if (verifiedFactors.length > 0) {
      setFactorId(verifiedFactors[0].id);
    } else {
      // No MFA configured, redirect to home
      router.push('/');
    }
  };

  const handleSuccess = () => {
    router.push('/');
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!factorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <MFAVerification
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        factorId={factorId}
      />
    </div>
  );
}