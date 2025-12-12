// P1BA-RATING: 정치인 별점 평가 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { politicianId: string } }
) {
  try {
    const { rating } = await request.json();
    const politicianId = params.politicianId;

    // 입력 검증
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '유효하지 않은 별점입니다. (1-5점)' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 기존 평가 확인
    const { data: existingRating } = await supabase
      .from('politician_ratings')
      .select('id')
      .eq('politician_id', politicianId)
      .eq('user_id', userId)
      .single();

    let ratingData;
    let upsertError;

    if (existingRating) {
      // 기존 평가 업데이트
      const { data, error } = await supabase
        .from('politician_ratings')
        .update({
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('politician_id', politicianId)
        .eq('user_id', userId)
        .select()
        .single();
      ratingData = data;
      upsertError = error;
    } else {
      // 새 평가 삽입
      const { data, error } = await supabase
        .from('politician_ratings')
        .insert([
          {
            politician_id: politicianId,
            user_id: userId,
            rating: rating,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      ratingData = data;
      upsertError = error;
    }

    if (upsertError) {
      console.error('Rating upsert error:', upsertError);
      return NextResponse.json(
        { error: '평가 저장에 실패했습니다.', details: upsertError.message },
        { status: 500 }
      );
    }

    // Trigger가 자동으로 평균 계산 및 업데이트하므로 중복 계산 제거
    // 대신 업데이트된 값을 조회
    const { data: updatedDetails, error: detailsError } = await supabase
      .from('politician_details')
      .select('user_rating, rating_count')
      .eq('politician_id', politicianId)
      .single();

    if (detailsError) {
      console.error('Details fetch error:', detailsError);
      // 평가는 저장되었으므로 기본 응답
      return NextResponse.json({
        success: true,
        message: '평가를 등록했습니다.',
        averageRating: rating,
        ratingCount: 1
      });
    }

    return NextResponse.json({
      success: true,
      message: '평가를 등록했습니다.',
      averageRating: Math.round(updatedDetails.user_rating * 10) / 10,
      ratingCount: updatedDetails.rating_count
    });

  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
