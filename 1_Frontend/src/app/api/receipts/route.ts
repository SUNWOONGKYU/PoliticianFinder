import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: {
      id: Math.random().toString(36).substring(7),
      ...body,
      url: 'https://example.com/receipt',
    },
  }, { status: 201 });
}