// Admin Notices API - 관리자용 공지사항 관리
// Supabase 연동 - 관리자가 공지사항을 CRUD

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';

    let query = (supabase as any)
      .from('notices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Notices query error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 목록 조회 중 오류가 발생했습니다', details: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: { page, limit, total, totalPages },
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/notices error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { title, content, is_pinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('notices')
      .insert({
        title,
        content,
        is_pinned: is_pinned || false,
        author_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Notice create error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 작성 중 오류가 발생했습니다', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '공지사항이 작성되었습니다',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/notices error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const notice_id = request.nextUrl.searchParams.get('id');

    if (!notice_id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // 공지사항 존재 확인
    const { data: existingNotice, error: fetchError } = await (supabase as any)
      .from('notices')
      .select('id, title')
      .eq('id', notice_id)
      .single();

    if (fetchError || !existingNotice) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 공지사항 삭제
    const { error: deleteError } = await (supabase as any)
      .from('notices')
      .delete()
      .eq('id', notice_id);

    if (deleteError) {
      console.error('Notice delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '공지사항 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/notices error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
