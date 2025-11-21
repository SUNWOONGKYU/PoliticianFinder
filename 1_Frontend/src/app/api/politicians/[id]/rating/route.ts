// P1BA-RATING: 정치인 별점 평가 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { rating } = await request.json();
    const politicianId = params.id;

    // 입력 검증
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '유효하지 않은 별점입니다. (1-5점)' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 평가 데이터 삽입
    const { data: ratingData, error: insertError } = await supabase
      .from('politician_ratings')
      .insert([
        {
          politician_id: politicianId, // TEXT 타입이므로 parseInt 제거
          user_id: userId,
          rating: rating,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Rating insert error:', insertError);
      return NextResponse.json(
        { error: '평가 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 해당 정치인의 평균 별점과 평가 수 계산
    const { data: stats, error: statsError } = await supabase
      .from('politician_ratings')
      .select('rating')
      .eq('politician_id', politicianId); // TEXT 타입이므로 parseInt 제거

    if (statsError) {
      console.error('Stats calculation error:', statsError);
      // 평가는 저장되었으므로 성공 응답
      return NextResponse.json({
        success: true,
        averageRating: rating,
        ratingCount: 1
      });
    }

    const averageRating = stats.length > 0
      ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length
      : 0;
    const ratingCount = stats.length;

    // politician_details 테이블 업데이트 (평균 별점 및 평가 수)
    // Note: Triggers가 자동으로 업데이트하므로 이 부분은 생략 가능
    // 하지만 명시적으로 업데이트할 수도 있음
    await supabase
      .from('politician_details')
      .update({
        user_rating: Math.round(averageRating * 100) / 100,
        rating_count: ratingCount,
        updated_at: new Date().toISOString()
      })
      .eq('politician_id', politicianId); // TEXT 타입이므로 parseInt 제거

    return NextResponse.json({
      success: true,
      averageRating: Math.round(averageRating * 10) / 10,
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
