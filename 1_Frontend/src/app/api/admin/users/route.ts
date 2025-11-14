// P1BA4: Mock API - 기타 (사용자 관리 API)
// Supabase 연동 - 관리자용 사용자 데이터 관리

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock Admin UUID for testing
const MOCK_ADMIN_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

const userUpdateSchema = z.object({
  user_id: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  admin_notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';
    const status = request.nextUrl.searchParams.get('status');
    const role = request.nextUrl.searchParams.get('role');

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 상태 필터 (status -> is_active/is_banned 매핑)
    if (status) {
      if (status === 'active') {
        query = query.eq('is_active', true).eq('is_banned', false);
      } else if (status === 'banned') {
        query = query.eq('is_banned', true);
      } else if (status === 'suspended') {
        query = query.eq('is_active', false).eq('is_banned', false);
      }
    }

    // 역할 필터
    if (role) {
      query = query.eq('role', role);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: '사용자 목록 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // profiles 테이블에는 이미 id, username, email 필드가 있음
    // status 필드는 is_active, is_banned에서 파생
    const sanitizedUsers = (data || []).map((profile: any) => ({
      id: profile.id,
      username: profile.username || profile.nickname || profile.name,
      email: profile.email,
      created_at: profile.created_at,
      status: profile.is_banned ? 'banned' : (profile.is_active ? 'active' : 'suspended'),
      role: profile.role || 'user',
      admin_notes: profile.banned_reason || '',
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
      pagination: { page, limit, total, totalPages },
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const validated = userUpdateSchema.parse(body);

    // 사용자 존재 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('id', validated.user_id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자 정보 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // status를 is_active, is_banned으로 변환
    if (validated.status) {
      if (validated.status === 'active') {
        updateData.is_active = true;
        updateData.is_banned = false;
      } else if (validated.status === 'banned') {
        updateData.is_banned = true;
      } else if (validated.status === 'suspended') {
        updateData.is_active = false;
        updateData.is_banned = false;
      }
    }
    if (validated.role) updateData.role = validated.role;
    if (validated.admin_notes) updateData.banned_reason = validated.admin_notes;

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', validated.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: '사용자 업데이트 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action_type: 'user_updated',
      target_type: 'user',
      target_id: validated.user_id,
      admin_id: MOCK_ADMIN_ID,
      metadata: validated,
    });

    // profiles 테이블에는 password 필드 없음
    const sanitizedUser = updatedUser;

    return NextResponse.json({
      success: true,
      data: sanitizedUser,
      message: '사용자 정보가 업데이트되었습니다',
    }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const user_id = request.nextUrl.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user_id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자 삭제 (실제로는 soft delete 권장)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: '사용자 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action_type: 'user_deleted',
      target_type: 'user',
      target_id: user_id,
      admin_id: MOCK_ADMIN_ID,
      metadata: { username: existingUser.username },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: 1 },
      message: '사용자가 삭제되었습니다',
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
