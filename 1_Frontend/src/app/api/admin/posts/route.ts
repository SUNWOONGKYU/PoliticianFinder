// Admin Posts API - 관리자용 게시물 관리
// Supabase 연동 - 관리자가 모든 게시물을 조회/관리

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createClient();

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name
        ),
        politicians (
          id,
          name,
          party
        )
      `, { count: 'exact' })
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
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: '게시물 목록 조회 중 오류가 발생했습니다' },
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
    console.error('GET /api/admin/posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const supabase = createClient();
    const post_id = request.nextUrl.searchParams.get('post_id');

    if (!post_id) {
      return NextResponse.json(
        { success: false, error: 'post_id is required' },
        { status: 400 }
      );
    }

    // 게시물 존재 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', post_id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: '게시물을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 게시물 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', post_id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '게시물 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action_type: 'post_deleted',
      target_type: 'post',
      target_id: post_id,
      admin_id: user.id,
      metadata: { title: existingPost.title },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: 1 },
      message: '게시물이 삭제되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
