// P3BA5_새정치인추가
// Admin API - 정치인 관리 (추가)
// Service Role Key 사용으로 RLS 우회
// Updated: 2025-11-17 - requireAdmin() 추가

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/helpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '') || '';

/**
 * GET /api/admin/politicians
 * 관리자용 정치인 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Environment variables check
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Admin Politicians API] Environment variables not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error. Please contact administrator.',
        },
        { status: 500 }
      );
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const search = request.nextUrl.searchParams.get('search') || '';
    const party = request.nextUrl.searchParams.get('party');

    // Create Supabase client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('politicians')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`);
    }

    // 정당 필터
    if (party) {
      query = query.eq('party', party);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('[Admin Politicians API] Query error:', error);
      return NextResponse.json(
        { success: false, error: '정치인 목록 조회 중 오류가 발생했습니다' },
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
    console.error('[Admin Politicians API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/politicians
 * 새 정치인 추가 (기본 정보만)
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Environment variables check
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Admin Politicians API] Environment variables not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error. Please contact administrator.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate request body
    const schema = z.object({
      name: z.string().min(1, "이름은 필수입니다"),
      name_en: z.string().optional(),
      party: z.string().min(1, "소속 정당은 필수입니다"),
      position: z.string().min(1, "출마직종은 필수입니다"),
      region: z.string().min(1, "광역 지역은 필수입니다"),
      district: z.string().min(1, "기초 지역은 필수입니다"),
      identity: z.string().min(1, "신분은 필수입니다"),
      title: z.string().optional(),
      birth_date: z.string().optional(),
      gender: z.string().optional(),
    });

    const validated = schema.parse(body);

    // Create Supabase client with Service Role Key (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if politician with same name already exists
    const { data: existing } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('name', validated.name)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `정치인 "${validated.name}"은(는) 이미 존재합니다.`,
        },
        { status: 400 }
      );
    }

    // Prepare politician data with basic info only
    // Additional info will be collected through data collection process
    const newPolitician = {
      name: validated.name,
      name_en: validated.name_en || null,
      party: validated.party,
      position: validated.position,
      region: validated.region,
      district: validated.district || null,
      identity: validated.identity,
      title: validated.title || null,
      birth_date: validated.birth_date || null,
      gender: validated.gender || null,
      // Set default values for fields to be collected later
      profile_image_url: `https://via.placeholder.com/150?text=${encodeURIComponent(validated.name)}`,
      education: [],
      website_url: null,
      facebook_url: null,
      twitter_url: null,
      instagram_url: null,
      youtube_url: null,
      phone: null,
      email: null,
      office_address: null,
      is_verified: false,
      verification_token: null,
      verified_at: null,
      verified_by: null,
      view_count: 0,
      favorite_count: 0,
      evaluation_score: 0,
      evaluation_grade: 'Tn', // Default grade
      ai_score: 0,
      user_rating: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert new politician
    const { data: inserted, error } = await supabase
      .from('politicians')
      .insert(newPolitician)
      .select()
      .single();

    if (error) {
      console.error('[Admin Politicians API] Insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: '정치인 추가 중 오류가 발생했습니다.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: inserted,
        message: `정치인 "${validated.name}"이(가) 성공적으로 추가되었습니다. 추가 정보는 데이터 수집 프로세스를 통해 채워집니다.`,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '입력 데이터가 올바르지 않습니다.',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[Admin Politicians API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
