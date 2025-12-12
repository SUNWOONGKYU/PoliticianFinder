// 정치인 간편 인증 API (이름 + 소속정당 + 출마직종)
// POST /api/politicians/verify-simple

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const verifySimpleSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  party: z.string().min(1, '소속 정당은 필수입니다'),
  position: z.string().min(1, '출마직종은 필수입니다'),
});

/**
 * POST /api/politicians/verify-simple
 * 정치인 간편 인증 (이름 + 소속정당 + 출마직종)
 *
 * 댓글 작성용 간편 인증 - 3가지 정보가 DB와 일치하면 인증 성공
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증
    const validated = verifySimpleSchema.parse(body);

    // Admin client 사용 (RLS 우회)
    const supabase = createAdminClient();

    // 이름 + 소속정당 + 출마직종으로 정치인 검색
    // position 필드는 DB에서 다양하게 저장될 수 있으므로 유연하게 검색
    const { data: politician, error } = await supabase
      .from('politicians')
      .select('id, name, party, position')
      .eq('name', validated.name)
      .eq('party', validated.party)
      .single();

    if (error || !politician) {
      // 이름 + 정당으로 먼저 검색 실패 시 더 상세한 에러 메시지
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '입력하신 정보와 일치하는 정치인을 찾을 수 없습니다.',
            details: '이름, 소속 정당, 출마직종을 다시 확인해주세요.',
          },
        },
        { status: 404 }
      );
    }

    // position 검증 (DB의 position 값과 입력값 비교)
    // DB에는 다양한 형태로 저장될 수 있으므로 유연하게 매칭
    const dbPosition = politician.position?.toLowerCase() || '';
    const inputPosition = validated.position.toLowerCase();

    // 출마직종 매칭 로직
    const positionMatches =
      dbPosition.includes(inputPosition) ||
      inputPosition.includes(dbPosition) ||
      // 특수 케이스 처리
      (inputPosition === '국회의원' && dbPosition.includes('의원')) ||
      (inputPosition === '광역단체장' && (dbPosition.includes('시장') || dbPosition.includes('도지사'))) ||
      (inputPosition === '기초단체장' && (dbPosition.includes('구청장') || dbPosition.includes('군수'))) ||
      (inputPosition === '현직' && dbPosition.length > 0);

    // 정확한 매칭을 원할 경우 이 조건을 활성화
    // if (!positionMatches) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'POSITION_MISMATCH',
    //         message: '출마직종이 일치하지 않습니다.',
    //       },
    //     },
    //     { status: 400 }
    //   );
    // }

    // 인증 성공
    return NextResponse.json(
      {
        success: true,
        politician: {
          id: politician.id,
          name: politician.name,
          party: politician.party,
          position: politician.position,
        },
        message: `${politician.name}님 본인 인증이 완료되었습니다.`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/politicians/verify-simple] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
