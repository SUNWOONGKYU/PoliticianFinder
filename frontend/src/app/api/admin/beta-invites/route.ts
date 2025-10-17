import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique invite code
    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create beta invite record
    const { data, error } = await supabase
      .from('beta_invites')
      .insert({
        email,
        name,
        invite_code: inviteCode,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create beta invite:', error);
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    // Send invitation email (integrate with your email service)
    // TODO: Implement email sending logic

    return NextResponse.json({
      invite_code: inviteCode,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Beta invite creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all beta invites
    const { data: testers, error } = await supabase
      .from('beta_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch beta testers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch beta testers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ testers });
  } catch (error) {
    console.error('Beta testers fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
