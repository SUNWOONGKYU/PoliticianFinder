import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { invite_code } = await request.json();

    if (!invite_code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify invite code
    const { data: invite, error } = await supabase
      .from('beta_invites')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invite.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invite code has already been used' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired' },
        { status: 400 }
      );
    }

    // Mark invite as accepted
    await supabase
      .from('beta_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    return NextResponse.json({
      message: 'Beta access granted',
      email: invite.email,
    });
  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
