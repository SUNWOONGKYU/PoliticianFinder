// P3BA40: 중개 서비스 업체 관리 Admin API
/**
 * 중개 서비스 업체 관리 API
 * GET: 업체 목록 조회
 * POST: 새 업체 등록
 * PATCH: 업체 정보 수정/상태 변경
 * DELETE: 업체 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET: 중개 업체 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 기본 쿼리
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('relay_providers')
      .select('*', { count: 'exact' });

    // 상태 필터
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 페이지네이션 및 정렬
    const { data, error, count } = await query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('중개 업체 목록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '중개 업체 목록 조회에 실패했습니다.' },
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
    console.error('중개 업체 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 중개 업체 등록
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      service_type,
      company_description,
      service_description,
      phone,
      email,
      website,
      address,
      logo_url,
      representative,
      business_number,
      status = 'pending',
      display_order = 0
    } = body;

    // 필수 필드 검증
    if (!name || !service_type || !company_description || !service_description || !phone || !email) {
      return NextResponse.json(
        { success: false, error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 서비스 유형 길이 검증
    if (service_type.length > 10) {
      return NextResponse.json(
        { success: false, error: '서비스 유형은 10자 이내로 입력해주세요.' },
        { status: 400 }
      );
    }

    // 업체 등록
    const insertData: Record<string, unknown> = {
      name,
      service_type,
      company_description,
      service_description,
      phone,
      email,
      status,
      display_order
    };

    // 선택 필드 추가
    if (website) insertData.website = website;
    if (address) insertData.address = address;
    if (logo_url) insertData.logo_url = logo_url;
    if (representative) insertData.representative = representative;
    if (business_number) insertData.business_number = business_number;

    // 활성 상태로 등록 시 승인 정보 추가
    if (status === 'active') {
      insertData.approved_at = new Date().toISOString();
      insertData.approved_by = user.id;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('relay_providers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('중개 업체 등록 실패:', error);
      return NextResponse.json(
        { success: false, error: '중개 업체 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'relay_provider_create',
        target_type: 'relay_provider',
        target_id: data.id,
        details: { name, service_type, status }
      });

    return NextResponse.json({
      success: true,
      message: '중개 업체가 등록되었습니다.',
      data
    });

  } catch (error) {
    console.error('중개 업체 등록 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 중개 업체 정보 수정/상태 변경
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '업체 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서비스 유형 길이 검증
    if (updateFields.service_type && updateFields.service_type.length > 10) {
      return NextResponse.json(
        { success: false, error: '서비스 유형은 10자 이내로 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 상태가 active로 변경되는 경우 승인 정보 추가
    if (updateFields.status === 'active') {
      // 현재 상태 확인
      const { data: current } = await supabaseAdmin
        .from('relay_providers')
        .select('status')
        .eq('id', id)
        .single();

      if (current && current.status !== 'active') {
        updateFields.approved_at = new Date().toISOString();
        updateFields.approved_by = user.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('relay_providers')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('중개 업체 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: '중개 업체 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'relay_provider_update',
        target_type: 'relay_provider',
        target_id: id,
        details: updateFields
      });

    return NextResponse.json({
      success: true,
      message: '중개 업체 정보가 수정되었습니다.',
      data
    });

  } catch (error) {
    console.error('중개 업체 수정 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 중개 업체 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '업체 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 삭제 전 데이터 조회 (로그용)
    const { data: provider } = await supabaseAdmin
      .from('relay_providers')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('relay_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('중개 업체 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: '중개 업체 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'relay_provider_delete',
        target_type: 'relay_provider',
        target_id: id,
        details: { name: provider?.name }
      });

    return NextResponse.json({
      success: true,
      message: '중개 업체가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('중개 업체 삭제 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
