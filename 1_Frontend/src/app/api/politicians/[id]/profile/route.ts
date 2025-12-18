/**
 * 정치인 프로필 수정 API
 *
 * GET /api/politicians/[id]/profile - 프로필 조회
 * PATCH /api/politicians/[id]/profile - 프로필 수정 (이메일 인증 필요)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Lazy initialization to avoid build-time errors
const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// 수정 가능한 필드 목록
const EDITABLE_FIELDS = [
  'contact_email',
  'contact_phone',
  'office_address',
  'website_url',
  'social_links',
  'self_introduction'
];

// politicians 테이블에서 수정 가능한 필드
const POLITICIAN_EDITABLE_FIELDS = [
  'biography'
];

/**
 * GET - 정치인 프로필 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase();
    const politicianId = params.id;

    // 기본 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, party, region, position, biography, profile_image_url')
      .eq('id', politicianId)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { error: '정치인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상세 정보 조회
    const { data: details } = await supabase
      .from('politician_details')
      .select('contact_email, contact_phone, office_address, website_url, social_links, self_introduction, updated_by_politician_at')
      .eq('politician_id', politicianId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...politician,
        details: details || {}
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - 정치인 프로필 수정
 * 이메일 인증 세션 필요
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase();
    const politicianId = params.id;
    const body = await request.json();
    const { session_id, updates } = body;

    // 세션 ID 검증
    if (!session_id) {
      return NextResponse.json(
        { error: '인증 세션이 필요합니다.' },
        { status: 401 }
      );
    }

    // 세션 유효성 확인
    const { data: session, error: sessionError } = await supabase
      .from('politician_sessions')
      .select('id, politician_id, expires_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '유효하지 않은 세션입니다.' },
        { status: 401 }
      );
    }

    // 세션 만료 확인
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '세션이 만료되었습니다. 다시 인증해주세요.' },
        { status: 401 }
      );
    }

    // 세션의 정치인 ID와 요청 ID 일치 확인
    if (session.politician_id !== politicianId) {
      return NextResponse.json(
        { error: '본인의 프로필만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 업데이트할 내용 검증
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    // politician_details 업데이트할 필드 분리
    const detailsUpdates: Record<string, any> = {};
    const politicianUpdates: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (EDITABLE_FIELDS.includes(key)) {
        detailsUpdates[key] = value;
      } else if (POLITICIAN_EDITABLE_FIELDS.includes(key)) {
        politicianUpdates[key] = value;
      }
    }

    const editHistory: Array<{ field: string; old: any; new: any }> = [];

    // politician_details 테이블 업데이트
    if (Object.keys(detailsUpdates).length > 0) {
      // 기존 값 조회
      const { data: currentDetails } = await supabase
        .from('politician_details')
        .select('*')
        .eq('politician_id', politicianId)
        .single();

      // 수정 이력 기록
      for (const [field, newValue] of Object.entries(detailsUpdates)) {
        const oldValue = currentDetails ? currentDetails[field] : null;
        if (oldValue !== newValue) {
          editHistory.push({ field, old: oldValue, new: newValue });
        }
      }

      // 업데이트 실행
      const { error: updateError } = await supabase
        .from('politician_details')
        .update({
          ...detailsUpdates,
          updated_by_politician_at: new Date().toISOString()
        })
        .eq('politician_id', politicianId);

      if (updateError) {
        console.error('Details update error:', updateError);
        return NextResponse.json(
          { error: '프로필 업데이트 실패: ' + updateError.message },
          { status: 500 }
        );
      }
    }

    // politicians 테이블 업데이트
    if (Object.keys(politicianUpdates).length > 0) {
      // 기존 값 조회
      const { data: currentPolitician } = await supabase
        .from('politicians')
        .select('biography')
        .eq('id', politicianId)
        .single();

      // 수정 이력 기록
      for (const [field, newValue] of Object.entries(politicianUpdates)) {
        const oldValue = currentPolitician ? currentPolitician[field as keyof typeof currentPolitician] : null;
        if (oldValue !== newValue) {
          editHistory.push({ field, old: oldValue, new: newValue });
        }
      }

      // 업데이트 실행
      const { error: updateError } = await supabase
        .from('politicians')
        .update({
          ...politicianUpdates,
          biography_updated_at: new Date().toISOString()
        })
        .eq('id', politicianId);

      if (updateError) {
        console.error('Politician update error:', updateError);
        return NextResponse.json(
          { error: '프로필 업데이트 실패: ' + updateError.message },
          { status: 500 }
        );
      }
    }

    // 수정 이력 저장
    if (editHistory.length > 0) {
      const historyRecords = editHistory.map(h => ({
        politician_id: politicianId,
        session_id: session_id,
        field_name: h.field,
        old_value: h.old ? String(h.old) : null,
        new_value: h.new ? String(h.new) : null
      }));

      await supabase.from('politician_profile_edits').insert(historyRecords);
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다.',
      updated_fields: editHistory.map(h => h.field)
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
