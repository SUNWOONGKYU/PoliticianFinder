// Check current authenticated user
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Session error',
        details: sessionError.message,
      }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        session: null,
      }, { status: 401 });
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User error',
        details: userError?.message,
      }, { status: 401 });
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
      },
      profile: profile || null,
      profileError: profileError ? profileError.message : null,
      session: {
        access_token: session.access_token ? 'exists' : 'missing',
        refresh_token: session.refresh_token ? 'exists' : 'missing',
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
