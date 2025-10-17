'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import type { BetaTester } from '@/types/beta-tester';

export function BetaTesterInvitePanel() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/beta-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Beta invite sent successfully!' });
        setInviteCode(data.invite_code);
        setEmail('');
        setName('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invite' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta Tester Invitation</CardTitle>
        <CardDescription>
          Send beta testing invitations to selected users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.text}
            </Alert>
          )}
          {inviteCode && (
            <Alert>
              <strong>Invite Code:</strong> {inviteCode}
              <br />
              <small>Share this code with the beta tester</small>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending Invite...' : 'Send Beta Invite'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function BetaTesterList() {
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTesters = async () => {
    try {
      const response = await fetch('/api/admin/beta-invites');
      const data = await response.json();
      if (response.ok) {
        setTesters(data.testers);
      }
    } catch (error) {
      console.error('Failed to fetch beta testers:', error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchTesters();
  });

  if (loading) {
    return <div>Loading beta testers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta Testers</CardTitle>
        <CardDescription>
          Manage and track beta testing participants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No beta testers yet</p>
          ) : (
            <div className="divide-y">
              {testers.map((tester) => (
                <div key={tester.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tester.name}</p>
                    <p className="text-sm text-muted-foreground">{tester.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {tester.invite_code} | Status: {tester.status}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      tester.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      tester.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tester.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
