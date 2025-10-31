/** P1BA4: 프로필 조회 API */
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../2_Backend_Infrastructure/P1BI2_auth_helpers';

export async function GET() {
  const { user, error } = await getCurrentUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user }, { status: 200 });
}
