import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, data: { id: Math.random().toString(36).substring(7), status: 'flagged' } }, { status: 201 });
}