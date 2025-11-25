// Admin Comments API - 관리자용 댓글 관리
// Supabase 연동 - 관리자가 모든 댓글을 조회/관리

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

    const supabase = await createClient();

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';

    let query = supabase
      .from('comments')
      .select(`
        *,
        users:user_id (
          user_id,
          name,
          email
        ),
        posts:post_id (
          id,
          title
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 필터
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: '댓글 목록 조회 중 오류가 발생했습니다' },
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
    console.error('GET /api/admin/comments error:', error);
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

    const supabase = await createClient();
    const comment_id = request.nextUrl.searchParams.get('comment_id');

    if (!comment_id) {
      return NextResponse.json(
        { success: false, error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // 댓글 존재 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, content')
      .eq('id', comment_id)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment_id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '댓글 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action_type: 'comment_deleted',
      target_type: 'comment',
      target_id: comment_id,
      admin_id: user.id,
      metadata: { content: existingComment.content },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: 1 },
      message: '댓글이 삭제되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
