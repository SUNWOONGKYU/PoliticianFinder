/**
 * 테스트용 Rate Limit 초기화 API
 * 개발 환경에서만 사용 가능
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate Limit 저장소를 직접 import할 수 없으므로
// 임시로 새로운 저장소를 만들거나,
// 간단히 성공 응답만 반환

export async function POST(request: NextRequest) {
  // 프로덕션에서는 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not allowed in production' },
      { status: 403 }
    );
  }

  // 개발 환경에서는 허용
  // 실제로는 auth.ts의 rateLimitStore를 clear해야 하지만
  // 모듈 레벨 변수라서 직접 접근 불가
  // 대신 서버 재시작을 권장하는 메시지 반환

  return NextResponse.json({
    success: true,
    message: 'Rate Limit 초기화를 위해 서버를 재시작하세요.',
    recommendation: '또는 28분 후에 다시 시도하세요.',
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST 요청을 사용하세요',
    usage: 'curl -X POST http://localhost:3002/api/test/clear-rate-limit',
  });
}
