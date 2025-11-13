import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // 환경 변수 확인
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', url);
    console.log('Has ANON_KEY:', hasKey);

    // 간단한 쿼리 테스트
    const { data, error, count } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        url,
        hasKey,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      });
    }

    return NextResponse.json({
      success: true,
      url,
      hasKey,
      totalPosts: count,
      samplePost: data?.[0] || null
    });
  } catch (error: any) {
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
