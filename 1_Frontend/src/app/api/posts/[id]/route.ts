
// P1BA3: Real API - 커뮤니티 게시글 상세
// Supabase RLS 연동: 게시글 조회/수정/삭제
// 정치인 세션 토큰 지원 추가 (2025-12-28)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { validatePoliticianSession } from '@/lib/auth/politicianSession';

const updatePostSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").optional(),
  content: z.string().min(10, "내용은 최소 10자 이상이어야 합니다").optional(),
  category: z.string().optional(),
});

const politicianUpdatePostSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").optional(),
  subject: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").optional(),
  content: z.string().min(10, "내용은 최소 10자 이상이어야 합니다").optional(),
  politician_id: z.string().length(8),
  session_token: z.string().length(64),
});

const politicianDeleteSchema = z.object({
  politician_id: z.string().length(8),
  session_token: z.string().length(64),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        politicians:politician_id (name, party, position, status),
        users:user_id (nickname, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', id);

    return NextResponse.json({
      success: true,
      data: { ...post, view_count: (post.view_count || 0) + 1 },
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabase = await createClient();

    // 정치인 세션 토큰으로 인증 시도
    if (body.session_token && body.politician_id) {
      const validated = politicianUpdatePostSchema.parse(body);
      const sessionResult = await validatePoliticianSession(validated.politician_id, validated.session_token);

      if (!sessionResult.valid) {
        return NextResponse.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: sessionResult.error?.message || '유효하지 않은 세션입니다.' },
        }, { status: 401 });
      }

      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('politician_id, author_type')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '게시글 조회 중 오류가 발생했습니다.' } }, { status: 500 });
      }

      if (existingPost.politician_id !== validated.politician_id) {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '게시글 수정 권한이 없습니다.' } }, { status: 403 });
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (validated.title) updateData.title = validated.title;
      if (validated.subject) updateData.subject = validated.subject;
      if (validated.content) updateData.content = validated.content;

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts').update(updateData).eq('id', id).select().single();

      if (updateError) {
        return NextResponse.json({ success: false, error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updatedPost }, { status: 200 });
    }

    // 일반 회원 인증
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const validated = updatePostSchema.parse(body);

    const { data: existingPost, error: fetchError } = await supabase
      .from('posts').select('user_id').eq('id', id).single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '게시글 조회 중 오류가 발생했습니다.' } }, { status: 500 });
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '게시글 수정 권한이 없습니다.' } }, { status: 403 });
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts').update({ ...validated, updated_at: new Date().toISOString() }).eq('id', id).select().single();

    if (updateError) {
      return NextResponse.json({ success: false, error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedPost }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    console.error('PATCH /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    let body: any = {};
    try { body = await request.json(); } catch {}

    // 정치인 세션 토큰으로 인증 시도
    if (body.session_token && body.politician_id) {
      const validated = politicianDeleteSchema.parse(body);
      const sessionResult = await validatePoliticianSession(validated.politician_id, validated.session_token);

      if (!sessionResult.valid) {
        return NextResponse.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: sessionResult.error?.message || '유효하지 않은 세션입니다.' },
        }, { status: 401 });
      }

      const { data: existingPost, error: fetchError } = await supabase
        .from('posts').select('politician_id, author_type').eq('id', id).single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '게시글 조회 중 오류가 발생했습니다.' } }, { status: 500 });
      }

      if (existingPost.politician_id !== validated.politician_id) {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '게시글 삭제 권한이 없습니다.' } }, { status: 403 });
      }

      const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);

      if (deleteError) {
        return NextResponse.json({ success: false, error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { postId: id }, message: '게시글이 삭제되었습니다.' }, { status: 200 });
    }

    // 일반 회원 인증
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { data: existingPost, error: fetchError } = await supabase
      .from('posts').select('user_id').eq('id', id).single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '게시글 조회 중 오류가 발생했습니다.' } }, { status: 500 });
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '게시글 삭제 권한이 없습니다.' } }, { status: 403 });
    }

    const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);

    if (deleteError) {
      return NextResponse.json({ success: false, error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { postId: id }, message: '게시글이 삭제되었습니다.' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
