import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: 공지사항 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 전체 개수 조회
    const { count } = await supabase
      .from('notices')
      .select('*', { count: 'exact', head: true });

    // 공지사항 목록 조회
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Notices fetch error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Notices API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 공지사항 작성
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await request.json();
    const { title, content } = body;

    // 유효성 검사
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 공지사항 저장
    const { data, error } = await supabase
      .from('notices')
      .insert([{
        title,
        content,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Notice insert error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 저장에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 등록되었습니다.',
      data
    });

  } catch (error) {
    console.error('Notice POST API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
