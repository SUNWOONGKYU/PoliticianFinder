// P4BA5: 욕설 필터 - API 통합 예제
// 작업일: 2025-11-09
// 설명: Next.js API Routes에서 욕설 필터 사용 예제

import { NextRequest, NextResponse } from 'next/server'
import {
  validateProfanity,
  filterProfanity,
  censorProfanity,
  detectProfanity,
  filterByLevel,
} from './profanity-filter'
import { ProfanityLevel } from './profanity-words'

// ============================================================================
// Example 1: Post Creation API (Strict Validation)
// ============================================================================

/**
 * POST /api/posts
 * 게시글 생성 - 욕설 포함 시 거부
 */
export async function createPostExample(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    // Validate title
    const titleValidation = validateProfanity(title, 'title')
    if (!titleValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: titleValidation.error,
          code: 'PROFANITY_DETECTED',
        },
        { status: 400 }
      )
    }

    // Validate content
    const contentValidation = validateProfanity(content, 'content')
    if (!contentValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: contentValidation.error,
          code: 'PROFANITY_DETECTED',
        },
        { status: 400 }
      )
    }

    // Proceed with post creation...
    // const post = await createPost({ title, content })

    return NextResponse.json({
      success: true,
      message: '게시글이 생성되었습니다.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '게시글 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Example 2: Comment Creation API (Filter and Allow)
// ============================================================================

/**
 * POST /api/comments
 * 댓글 생성 - 욕설 자동 필터링 후 저장
 */
export async function createCommentExample(request: NextRequest) {
  try {
    const { postId, content } = await request.json()

    // Filter profanity instead of rejecting
    const filteredContent = filterProfanity(content)

    // Save with filtered content
    // const comment = await createComment({
    //   postId,
    //   content: filteredContent,
    // })

    return NextResponse.json({
      success: true,
      message: '댓글이 등록되었습니다.',
      data: {
        content: filteredContent,
        wasFiltered: filteredContent !== content,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '댓글 등록 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Example 3: User Profile Update (Level-based Policy)
// ============================================================================

/**
 * PATCH /api/users/profile
 * 프로필 업데이트 - 레벨별 필터링 정책
 */
export async function updateProfileExample(request: NextRequest) {
  try {
    const { bio, nickname } = await request.json()

    // Nickname: Strict policy (no profanity allowed)
    const nicknameCheck = censorProfanity(nickname)
    if (nicknameCheck === null) {
      return NextResponse.json(
        {
          success: false,
          error: '닉네임에 부적절한 언어가 포함되어 있습니다.',
        },
        { status: 400 }
      )
    }

    // Bio: Lenient policy (allow mild profanity, filter severe)
    const bioResult = filterByLevel(bio, ProfanityLevel.MILD)
    const processedBio = bioResult.allowed ? bio : bioResult.filtered

    // Update profile
    // await updateUserProfile({
    //   nickname: nicknameCheck,
    //   bio: processedBio,
    // })

    return NextResponse.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        nickname: nicknameCheck,
        bio: processedBio,
        bioFiltered: !bioResult.allowed,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '프로필 업데이트 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Example 4: Content Moderation API (Admin)
// ============================================================================

/**
 * GET /api/admin/moderation/check
 * 욕설 상세 분석 (관리자용)
 */
export async function checkProfanityExample(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || ''

    // Detailed profanity detection
    const detection = detectProfanity(text)

    return NextResponse.json({
      success: true,
      data: {
        hasProfanity: detection.hasProfanity,
        detectedWords: detection.detectedWords,
        maxLevel: detection.maxLevel,
        positions: detection.positions,
        levelName: getLevelName(detection.maxLevel),
        filtered: filterProfanity(text),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '욕설 검사 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Example 5: Batch Content Filtering
// ============================================================================

/**
 * POST /api/admin/content/filter-batch
 * 대량 콘텐츠 필터링 (관리자용)
 */
export async function filterBatchExample(request: NextRequest) {
  try {
    const { contents } = await request.json()

    if (!Array.isArray(contents)) {
      return NextResponse.json(
        {
          success: false,
          error: 'contents는 배열이어야 합니다.',
        },
        { status: 400 }
      )
    }

    const results = contents.map((content) => {
      const detection = detectProfanity(content)
      return {
        original: content,
        filtered: filterProfanity(content),
        hasProfanity: detection.hasProfanity,
        detectedWords: detection.detectedWords,
        maxLevel: detection.maxLevel,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        total: results.length,
        withProfanity: results.filter((r) => r.hasProfanity).length,
        results,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '배치 필터링 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Example 6: Real-time Validation Endpoint
// ============================================================================

/**
 * POST /api/validate/profanity
 * 실시간 욕설 검증 (클라이언트용)
 */
export async function validateProfanityExample(request: NextRequest) {
  try {
    const { text, fieldName = 'text' } = await request.json()

    const validation = validateProfanity(text, fieldName)

    return NextResponse.json({
      success: true,
      data: {
        valid: validation.valid,
        error: validation.error,
        filtered: validation.valid ? text : filterProfanity(text),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '검증 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLevelName(level: ProfanityLevel): string {
  switch (level) {
    case ProfanityLevel.MILD:
      return '경미'
    case ProfanityLevel.MODERATE:
      return '중간'
    case ProfanityLevel.SEVERE:
      return '심각'
    case ProfanityLevel.EXTREME:
      return '극심'
    default:
      return '알 수 없음'
  }
}

// ============================================================================
// Middleware Example
// ============================================================================

/**
 * Profanity filtering middleware
 * 모든 POST/PUT/PATCH 요청의 텍스트 필드를 자동으로 검증
 */
export async function profanityMiddleware(
  request: NextRequest,
  textFields: string[] = ['content', 'title', 'description']
) {
  try {
    const body = await request.json()

    for (const field of textFields) {
      if (body[field] && typeof body[field] === 'string') {
        const validation = validateProfanity(body[field], field)
        if (!validation.valid) {
          return NextResponse.json(
            {
              success: false,
              error: validation.error,
              code: 'PROFANITY_DETECTED',
              field,
            },
            { status: 400 }
          )
        }
      }
    }

    return null // Pass through
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '요청 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Zod Schema Integration Example
// ============================================================================

import { z } from 'zod'

/**
 * Custom Zod validator for profanity
 */
export const noProfanityString = () =>
  z.string().refine(
    (val) => {
      const validation = validateProfanity(val)
      return validation.valid
    },
    {
      message: '부적절한 언어가 포함되어 있습니다.',
    }
  )

/**
 * Example schema with profanity validation
 */
export const CreatePostSchema = z.object({
  title: noProfanityString().min(1).max(200),
  content: noProfanityString().min(1).max(5000),
  tags: z.array(z.string()).optional(),
})

/**
 * Usage with Zod schema
 */
export async function createPostWithZod(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with schema (includes profanity check)
    const validated = CreatePostSchema.parse(body)

    // Proceed with validated data
    return NextResponse.json({
      success: true,
      message: '게시글이 생성되었습니다.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '입력값 검증 실패',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: '게시글 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
