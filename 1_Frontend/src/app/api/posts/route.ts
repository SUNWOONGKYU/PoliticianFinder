// P3BA3: Real API - 커뮤니티 (게시글 목록/작성)
// Supabase RLS 연동: 실제 인증 사용자 기반 CRUD
// 정치인 글쓰기 지원 추가

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth, checkUserRestrictions } from "@/lib/auth/helpers";
import { validatePoliticianSession } from "@/lib/auth/politicianSession";

// 일반 회원 글쓰기 스키마
const createPostSchema = z.object({
  subject: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").max(200, "제목은 최대 200자까지 입력 가능합니다"),
  content: z.string().min(10, "내용은 최소 10자 이상이어야 합니다").max(10000, "내용은 최대 10000자까지 입력 가능합니다"),
  category: z.enum(["general", "question", "debate", "news"]).default("general"),
  politician_id: z.string().optional().nullable(),
  tags: z.array(z.string()).max(5, "태그는 최대 5개까지 입력 가능합니다").optional(),
});

// 정치인 글쓰기 스키마
const politicianPostSchema = z.object({
  politician_id: z.string().min(8).max(8, "politician_id는 8자리 hex 문자열이어야 합니다"),
  session_token: z.string().min(64).max(64, "session_token은 64자리 hex 문자열이어야 합니다"),
  subject: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").max(200, "제목은 최대 200자까지 입력 가능합니다"),
  content: z.string().min(10, "내용은 최소 10자 이상이어야 합니다").max(10000, "내용은 최대 10000자까지 입력 가능합니다"),
  category: z.enum(["general", "question", "debate", "news"]).default("general"),
  tags: z.array(z.string()).max(5, "태그는 최대 5개까지 입력 가능합니다").optional(),
  author_type: z.literal('politician'),
});

const getPostsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("20").transform(Number).refine(val => val >= 1 && val <= 100, "limit은 1-100 사이여야 합니다"),
  category: z.string().optional(),
  politician_id: z.string().optional(),
  has_politician: z.string().optional().transform(val => val === 'true'),
  sort: z.string().optional().default("-created_at"),
});

/**
 * POST /api/posts
 * 게시글 작성 (회원 인증 또는 정치인 세션 토큰 필요)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // author_type에 따라 분기
    if (body.author_type === 'politician') {
      // ===== 정치인 글쓰기 =====
      return await handlePoliticianPost(request, body);
    } else {
      // ===== 일반 회원 글쓰기 =====
      return await handleUserPost(request, body);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    console.error("[POST /api/posts] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 정치인 글쓰기 처리
 */
async function handlePoliticianPost(request: NextRequest, body: any) {
  try {
    // 1. 스키마 검증
    const validated = politicianPostSchema.parse(body);

    // 2. 세션 토큰 검증 (헬퍼 함수 사용)
    const validationResult = await validatePoliticianSession(
      validated.politician_id,
      validated.session_token
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error,
        },
        { status: validationResult.error?.code === 'NOT_FOUND' ? 404 : 401 }
      );
    }

    // 3. Admin client로 게시글 삽입 (RLS 우회)
    const supabase = createAdminClient();
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: null,
        politician_id: validated.politician_id,
        title: validated.subject,
        content: validated.content,
        category: validated.category,
        tags: validated.tags || null,
        author_type: 'politician',
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/posts] Politician post insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 작성 중 오류가 발생했습니다.',
            details: insertError.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newPost,
        message: `${validationResult.politician?.name}님의 게시글이 작성되었습니다.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[handlePoliticianPost] Error:', error);
    throw error;
  }
}

/**
 * 일반 회원 글쓰기 처리
 */
async function handleUserPost(request: NextRequest, body: any) {
  try {
    // 1. 인증 확인
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // 2. 사용자 제한 확인 (밴 여부 등)
    const isRestricted = await checkUserRestrictions(user.id);
    if (isRestricted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '계정이 제한되어 게시글을 작성할 수 없습니다.',
          },
        },
        { status: 403 }
      );
    }

    // 3. 요청 데이터 검증
    const validated = createPostSchema.parse(body);

    // 4. Supabase 클라이언트 생성 (RLS 적용됨)
    const supabase = await createClient();

    // 5. politician_id 존재 여부 확인 (선택적)
    if (validated.politician_id) {
      const { data: politician, error: politicianError } = await supabase
        .from('politicians')
        .select('id')
        .eq('id', validated.politician_id)
        .single();

      if (politicianError || !politician) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '정치인을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        );
      }
    }

    // 6. 게시글 삽입 (RLS 정책으로 user_id 자동 검증)
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: validated.subject,
        content: validated.content,
        category: validated.category,
        politician_id: validated.politician_id || null,
        tags: validated.tags || null,
        author_type: 'user',
        moderation_status: 'approved',
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/posts] User post insert error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 작성 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[handleUserPost] Error:', error);
    throw error;
  }
}

/**
 * GET /api/posts
 * 게시글 목록 조회 (인증 선택적)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      category: searchParams.get("category") || undefined,
      politician_id: searchParams.get("politician_id") || undefined,
      has_politician: searchParams.get("has_politician") || undefined,
      sort: searchParams.get("sort") || "-created_at",
    };

    const query = getPostsQuerySchema.parse(queryParams);

    // 2. Supabase 클라이언트 생성 (RLS 적용됨)
    const supabase = await createClient();

    // 3. 쿼리 빌더 시작 (RLS로 승인된 게시글만 조회)
    let queryBuilder = supabase
      .from("posts")
      .select(`
        *,
        politicians:politician_id (
          name,
          position,
          party,
          status
        ),
        profiles:user_id (
          username,
          nickname,
          email
        )
      `, { count: "exact" })

    // 4. 필터 적용
    if (query.category) {
      queryBuilder = queryBuilder.eq("category", query.category);
    }

    if (query.politician_id) {
      queryBuilder = queryBuilder.eq("politician_id", query.politician_id);
    }

    if (query.has_politician !== undefined) {
      if (query.has_politician) {
        // politician_id가 null이 아닌 게시글만
        queryBuilder = queryBuilder.not("politician_id", "is", null);
      } else {
        // politician_id가 null인 게시글만
        queryBuilder = queryBuilder.is("politician_id", null);
      }
    }

    // 5. 정렬 적용
    const sortKey = query.sort.startsWith("-") ? query.sort.substring(1) : query.sort;
    const isDescending = query.sort.startsWith("-");

    // 고정 게시글 우선, 그 다음 정렬
    queryBuilder = queryBuilder
      .order(sortKey as any, { ascending: !isDescending });

    // 6. 페이지네이션 적용
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;
    queryBuilder = queryBuilder.range(start, end);

    // 7. 데이터 가져오기
    const { data: posts, count, error } = await queryBuilder;

    if (error) {
      console.error("[GET /api/posts] Supabase query error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 목록 조회 중 오류가 발생했습니다.',
          },
        },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: posts || [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    console.error("[GET /api/posts] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
