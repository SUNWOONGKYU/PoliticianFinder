'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Key, AlertCircle, Check, Copy, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface Factor {
  id: string;
  status: 'verified' | 'unverified';
  type: 'totp';
  friendly_name?: string;
  created_at: string;
  updated_at: string;
  last_challenged_at?: string;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [setupStep, setSetupStep] = useState<'initial' | 'qr' | 'verify' | 'backup'>('initial');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentFactorId, setCurrentFactorId] = useState<string>('');

  useEffect(() => {
    if (user) {
      checkMFAStatus();
    }
  }, [user]);

  const checkMFAStatus = async () => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (currentUser) {
        const assuranceLevels = await supabase.auth.mfa.getAuthenticatorAssuranceLevels();
        const factorList = await supabase.auth.mfa.listFactors();

        if (factorList.data && factorList.data.totp) {
          setFactors(factorList.data.totp);
          const verifiedFactors = factorList.data.totp.filter(f => f.status === 'verified');
          setMfaEnabled(verifiedFactors.length > 0);
        }
      }
    } catch (err: any) {
      console.error('Error checking MFA status:', err);
      setError('Failed to check 2FA status');
    }
  };

  const startMFASetup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (enrollError) throw enrollError;

      if (data) {
        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(data.qr_code, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        setQrCodeUrl(qrCodeDataUrl);
        setSecretKey(data.secret);
        setCurrentFactorId(data.id);
        setSetupStep('qr');
      }
    } catch (err: any) {
      console.error('MFA setup error:', err);
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const challengeResult = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });

      if (challengeResult.error) throw challengeResult.error;

      const verifyResult = await supabase.auth.mfa.verify({
        factorId: currentFactorId,
        challengeId: challengeResult.data.id,
        code: verificationCode
      });

      if (verifyResult.error) throw verifyResult.error;

      // Generate backup codes after successful verification
      await generateBackupCodes();

      setSetupStep('backup');
      setSuccess('2FA has been successfully enabled!');
      await checkMFAStatus();
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    // Generate 10 backup codes
    const codes = Array.from({ length: 10 }, () => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    });

    setBackupCodes(codes);

    // Store backup codes securely (you might want to store these server-side)
    // For now, we'll just display them to the user
  };

  const disableMFA = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factorId
      });

      if (unenrollError) throw unenrollError;

      setSuccess('2FA has been disabled');
      setMfaEnabled(false);
      await checkMFAStatus();
      setSetupStep('initial');
    } catch (err: any) {
      console.error('Disable MFA error:', err);
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `PoliticianFinder 2FA Backup Codes
Generated: ${new Date().toLocaleString()}
Account: ${user?.email}

IMPORTANT: Keep these codes safe! Each code can only be used once.

${backupCodes.join('\n')}

Store these codes in a secure location.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'politicianfinder-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetSetup = () => {
    setSetupStep('initial');
    setQrCodeUrl('');
    setSecretKey('');
    setVerificationCode('');
    setBackupCodes([]);
    setCurrentFactorId('');
    setError(null);
    setSuccess(null);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account by requiring both your password and an authentication code from your phone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {mfaEnabled && factors.length > 0 && setupStep === 'initial' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">2FA is enabled</p>
                      <p className="text-sm text-muted-foreground">Your account is protected with 2FA</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => disableMFA(factors[0].id)}
                    disabled={loading}
                  >
                    Disable 2FA
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Active Devices</h3>
                  {factors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                        <p className="text-xs text-muted-foreground">
                          Added: {new Date(factor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        factor.status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {factor.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!mfaEnabled && setupStep === 'initial' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication is not currently enabled on your account.
                </p>
                <Button onClick={startMFASetup} disabled={loading}>
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            )}

            {setupStep === 'qr' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>

                  {qrCodeUrl && (
                    <div className="flex justify-center">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="border rounded-lg" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</p>
                    <div className="flex items-center gap-2 justify-center">
                      <code className="px-3 py-1 bg-gray-100 rounded text-xs">{secretKey}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(secretKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Verify Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app to verify the setup.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={verifyMFASetup}
                      disabled={loading || verificationCode.length !== 6}
                    >
                      Verify and Enable 2FA
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetSetup}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 'backup' && backupCodes.length > 0 && (
              <div className="space-y-6">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Save these backup codes in a secure place. You can use them to access your account if you lose your phone.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Backup Codes</h3>
                  <p className="text-sm text-muted-foreground">
                    Each code can only be used once. Store them securely.
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="text-sm font-mono">
                        {code}
                      </code>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={downloadBackupCodes}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Codes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setSetupStep('initial');
                        checkMFAStatus();
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Enable two-factor authentication for maximum security</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Keep your backup codes in a secure location</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Use a reputable authenticator app like Google Authenticator or Authy</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Review your account activity regularly</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}