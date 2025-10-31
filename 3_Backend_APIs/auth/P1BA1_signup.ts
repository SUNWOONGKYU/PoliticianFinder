/**
 * Project Grid Task ID: P1BA1
 * 작업명: 회원가입 API
 * 생성시간: 2025-10-31 14:32
 * 생성자: Claude-Sonnet-4.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '../../2_Backend_Infrastructure/P1BI2_auth_helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data, error } = await signUp(email, password, name);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
