/**
 * Project Grid Task ID: P1BA2
 * 작업명: 로그인 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '../../2_Backend_Infrastructure/P1BI2_auth_helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const { data, error } = await signIn(email, password);

    if (error) return NextResponse.json({ error: error.message }, { status: 401 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
