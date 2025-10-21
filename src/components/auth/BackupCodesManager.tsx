'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, RefreshCw, Download, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

interface BackupCodesManagerProps {
  userId?: string;
  onRegenerate?: (newCodes: string[]) => void;
}

export function BackupCodesManager({ userId, onRegenerate }: BackupCodesManagerProps) {
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackupCodes();
  }, [userId]);

  const loadBackupCodes = async () => {
    // In a real implementation, this would fetch from secure storage
    // For now, we'll generate placeholder codes
    const storedCodes = localStorage.getItem(`backup-codes-${userId}`);

    if (storedCodes) {
      try {
        const parsed = JSON.parse(storedCodes);
        setBackupCodes(parsed);
      } catch (err) {
        console.error('Error parsing backup codes:', err);
        generateNewBackupCodes();
      }
    } else {
      generateNewBackupCodes();
    }
  };

  const generateNewBackupCodes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate 10 new backup codes
      const newCodes: BackupCode[] = Array.from({ length: 10 }, () => ({
        code: generateSecureCode(),
        used: false
      }));

      setBackupCodes(newCodes);

      // Store securely (in production, this should be server-side)
      if (userId) {
        localStorage.setItem(`backup-codes-${userId}`, JSON.stringify(newCodes));
      }

      if (onRegenerate) {
        onRegenerate(newCodes.map(c => c.code));
      }

      setSuccess('New backup codes generated successfully!');
      setShowCodes(true); // Show codes after generation

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError('Failed to generate backup codes');
      console.error('Error generating backup codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSecureCode = (): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    // Use crypto API for secure random generation
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < 8; i++) {
      code += charset[randomValues[i] % charset.length];
    }

    return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(null), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const content = `PoliticianFinder 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes safe! Each code can only be used once.

${backupCodes.map((c, i) => `${i + 1}. ${c.code}${c.used ? ' (USED)' : ''}`).join('\n')}

Store these codes in a secure location like a password manager.
If you lose access to your authenticator app, you can use these codes to log in.

Each code can only be used once.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'politicianfinder-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);

    setSuccess('Backup codes downloaded!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const unusedCodesCount = backupCodes.filter(c => !c.used).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Backup Recovery Codes
        </CardTitle>
        <CardDescription>
          Use these codes to access your account if you lose your phone or can't use your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Remaining Codes</p>
            <p className={`text-2xl font-bold ${
              unusedCodesCount <= 3 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {unusedCodesCount} / {backupCodes.length}
            </p>
          </div>
          {unusedCodesCount <= 3 && (
            <Alert className="flex-1 ml-4">
              <AlertDescription className="text-xs">
                You're running low on backup codes. Generate new ones soon.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Backup Codes</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCodes(!showCodes)}
            >
              {showCodes ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show
                </>
              )}
            </Button>
          </div>

          {showCodes && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
                {backupCodes.map((backupCode, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      backupCode.used
                        ? 'bg-gray-200 line-through opacity-50'
                        : 'bg-white border'
                    }`}
                  >
                    <code className="text-sm font-mono">
                      {backupCode.used ? '••••-••••' : backupCode.code}
                    </code>
                    {!backupCode.used && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(backupCode.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                  disabled={unusedCodesCount === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(
                    backupCodes
                      .filter(c => !c.used)
                      .map(c => c.code)
                      .join('\n')
                  )}
                  disabled={unusedCodesCount === 0}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Generating new codes will invalidate all existing unused codes. Make sure to save the new codes.
            </AlertDescription>
          </Alert>

          <Button
            onClick={generateNewBackupCodes}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate New Backup Codes
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Each code can only be used once</p>
          <p>• Store these codes in a secure place</p>
          <p>• Don't share these codes with anyone</p>
          <p>• Generate new codes if you suspect they've been compromised</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Missing imports
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';