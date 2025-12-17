// Admin Notices [id] API - 관리자용 공지사항 개별 관리
// Supabase 연동 - 관리자가 공지사항을 조회/수정/삭제

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const notice_id = params.id;

    const { data, error } = await (supabase as any)
      .from('notices')
      .select('*')
      .eq('id', notice_id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/notices/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const notice_id = params.id;
    const body = await request.json();

    const { title, content, is_pinned } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const { data, error } = await (supabase as any)
      .from('notices')
      .update(updateData)
      .eq('id', notice_id)
      .select()
      .single();

    if (error) {
      console.error('Notice update error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 수정 중 오류가 발생했습니다', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '공지사항이 수정되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/admin/notices/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 🔥 NO AUTH CHECK - DIRECT ADMIN CLIENT 🔥
  try {
    const supabase = createAdminClient();
    const notice_id = params.id;

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
    console.error('DELETE /api/admin/notices/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
