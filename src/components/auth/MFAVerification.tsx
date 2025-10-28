'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Key, AlertCircle } from 'lucide-react';

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel?: () => void;
  factorId?: string;
}

export function MFAVerification({ onSuccess, onCancel, factorId }: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string>('');
  const [availableFactors, setAvailableFactors] = useState<any[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    initiateMFAChallenge();
  }, [factorId]);

  const initiateMFAChallenge = async () => {
    try {
      // Get available factors if not provided
      if (!factorId) {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        if (factors?.totp && factors.totp.length > 0) {
          const verifiedFactors = factors.totp.filter(f => f.status === 'verified');
          if (verifiedFactors.length > 0) {
            setAvailableFactors(verifiedFactors);
            // Use the first verified factor
            const firstFactor = verifiedFactors[0];
            initiateChallenge(firstFactor.id);
          } else {
            setError('No verified 2FA factors found');
          }
        } else {
          setError('No 2FA factors configured');
        }
      } else {
        initiateChallenge(factorId);
      }
    } catch (err: any) {
      console.error('Error initiating MFA:', err);
      setError(err.message || 'Failed to initiate 2FA verification');
    }
  };

  const initiateChallenge = async (fId: string) => {
    try {
      const { data, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: fId
      });

      if (challengeError) throw challengeError;

      if (data) {
        setChallengeId(data.id);
      }
    } catch (err: any) {
      console.error('Challenge error:', err);
      setError(err.message || 'Failed to create challenge');
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || (verificationCode.length !== 6 && !useBackupCode)) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: availableFactors[0]?.id || factorId!,
        challengeId: challengeId,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      if (data) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      if (err.message.includes('Invalid') || err.message.includes('incorrect')) {
        setError('Invalid verification code. Please try again.');
      } else {
        setError(err.message || 'Verification failed');
      }
      setVerificationCode('');
      // Reset input fields
      inputRefs.current.forEach(input => {
        if (input) input.value = '';
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);

    // Update the verification code
    const codeArray = verificationCode.split('');
    codeArray[index] = digit;
    const newCode = codeArray.join('').slice(0, 6);
    setVerificationCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.length === 6 && index === 5) {
      verifyCode();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && verificationCode.length === 6) {
      verifyCode();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setVerificationCode(pastedData);

    // Fill all inputs with pasted data
    pastedData.split('').forEach((digit, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]!.value = digit;
      }
    });

    // Focus last filled input or last input if all filled
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if 6 digits were pasted
    if (pastedData.length === 6) {
      setTimeout(() => verifyCode(), 100);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          {useBackupCode
            ? 'Enter one of your backup codes to access your account'
            : 'Enter the 6-digit code from your authenticator app'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!useBackupCode ? (
          <div className="space-y-4">
            <Label>Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {[...Array(6)].map((_, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-semibold"
                  onChange={(e) => handleCodeInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              id="backup-code"
              type="text"
              placeholder="XXXX-XXXX"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              disabled={loading}
              className="text-center tracking-widest"
            />
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={verifyCode}
            disabled={loading || (!useBackupCode && verificationCode.length !== 6)}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="w-full"
            disabled={loading}
          >
            <Key className="w-4 h-4 mr-2" />
            {useBackupCode ? 'Use Authenticator App' : 'Use Backup Code'}
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-center">
          <a
            href="/settings/security"
            className="text-sm text-muted-foreground hover:underline"
          >
            Having trouble? Manage your 2FA settings
          </a>
        </div>
      </CardContent>
    </Card>
  );
}