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
      console.error('Auth error:', authError);
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

    let upsertError;

    if (existingRating) {
      // 기존 평가 업데이트
      const { error } = await supabase
        .from('politician_ratings')
        .update({
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('politician_id', politicianId)
        .eq('user_id', userId);
      upsertError = error;
    } else {
      // 새 평가 삽입
      const { error } = await supabase
        .from('politician_ratings')
        .insert([
          {
            politician_id: politicianId,
            user_id: userId,
            rating: rating,
            created_at: new Date().toISOString()
          }
        ]);
      upsertError = error;
    }

    if (upsertError) {
      console.error('Rating upsert error:', upsertError);
      return NextResponse.json(
        { error: '평가 저장에 실패했습니다.', details: upsertError.message },
        { status: 500 }
      );
    }

    // 평균 점수와 평가 수 직접 계산
    const { data: allRatings, error: fetchError } = await supabase
      .from('politician_ratings')
      .select('rating')
      .eq('politician_id', politicianId);

    if (fetchError) {
      console.error('Ratings fetch error:', fetchError);
      return NextResponse.json({
        success: true,
        message: '평가를 등록했습니다.',
        averageRating: rating,
        ratingCount: 1
      });
    }

    const ratingCount = allRatings?.length || 1;
    const averageRating = allRatings && allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
      : rating;

    // politicians 테이블에 평균 점수 업데이트
    const { error: updateError } = await supabase
      .from('politicians')
      .update({
        user_rating: averageRating,
        rating_count: ratingCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', politicianId);

    if (updateError) {
      console.error('Politicians update error:', updateError);
      // 평가는 저장되었으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: '평가를 등록했습니다.',
      averageRating,
      ratingCount
    });

  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
