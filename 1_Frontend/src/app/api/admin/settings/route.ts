import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, data: { maintenanceMode: false } }, { status: 200 });
}
export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: true, data: {} }, { status: 200 });
}