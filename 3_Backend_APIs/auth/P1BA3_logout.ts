/** P1BA3: 로그아웃 API */
import { NextResponse } from 'next/server';
import { signOut } from '../../2_Backend_Infrastructure/P1BI2_auth_helpers';

export async function POST() {
  const { error } = await signOut();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: 'Logged out' }, { status: 200 });
}
