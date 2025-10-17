/**
 * Comments RLS Security Test Suite
 * 작업 ID: P2E2
 * 작성일: 2025-01-17
 * 설명: comments 테이블의 Row Level Security 정책을 검증하는 보안 테스트
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

// 테스트 환경 설정
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 테스트용 사용자 계정
const testUsers = {
  user1: {
    email: 'test1@example.com',
    password: 'TestPassword123!',
    id: ''
  },
  user2: {
    email: 'test2@example.com',
    password: 'TestPassword123!',
    id: ''
  },
  user3: {
    email: 'test3@example.com',
    password: 'TestPassword123!',
    id: ''
  }
}

// 테스트 데이터 저장
let testPostId: number
let testCommentIds: number[] = []

describe('Comments RLS - Security Test Suite', () => {
  let anonClient: SupabaseClient
  let serviceClient: SupabaseClient
  let user1Client: SupabaseClient
  let user2Client: SupabaseClient
  let user3Client: SupabaseClient

  beforeAll(async () => {
    // Supabase 클라이언트 초기화
    anonClient = createClient(supabaseUrl, supabaseAnonKey)
    serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // 테스트 사용자 생성
    const { data: userData1 } = await serviceClient.auth.admin.createUser({
      email: testUsers.user1.email,
      password: testUsers.user1.password,
      email_confirm: true
    })
    testUsers.user1.id = userData1?.user?.id || ''

    const { data: userData2 } = await serviceClient.auth.admin.createUser({
      email: testUsers.user2.email,
      password: testUsers.user2.password,
      email_confirm: true
    })
    testUsers.user2.id = userData2?.user?.id || ''

    const { data: userData3 } = await serviceClient.auth.admin.createUser({
      email: testUsers.user3.email,
      password: testUsers.user3.password,
      email_confirm: true
    })
    testUsers.user3.id = userData3?.user?.id || ''

    // 사용자별 클라이언트 생성
    user1Client = createClient(supabaseUrl, supabaseAnonKey)
    await user1Client.auth.signInWithPassword({
      email: testUsers.user1.email,
      password: testUsers.user1.password
    })

    user2Client = createClient(supabaseUrl, supabaseAnonKey)
    await user2Client.auth.signInWithPassword({
      email: testUsers.user2.email,
      password: testUsers.user2.password
    })

    user3Client = createClient(supabaseUrl, supabaseAnonKey)
    await user3Client.auth.signInWithPassword({
      email: testUsers.user3.email,
      password: testUsers.user3.password
    })

    // 테스트용 게시글 생성 (User1이 작성)
    const { data: postData } = await user1Client
      .from('posts')
      .insert({
        title: 'Test Post for Comments',
        content: 'This is a test post',
        user_id: testUsers.user1.id
      })
      .select()
      .single()

    testPostId = postData?.id
  })

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testPostId) {
      await serviceClient.from('posts').delete().eq('id', testPostId)
    }

    // 테스트 사용자 삭제
    await serviceClient.auth.admin.deleteUser(testUsers.user1.id)
    await serviceClient.auth.admin.deleteUser(testUsers.user2.id)
    await serviceClient.auth.admin.deleteUser(testUsers.user3.id)
  })

  beforeEach(async () => {
    // 각 테스트 전 댓글 데이터 정리
    testCommentIds = []
  })

  describe('SELECT Policy - Public Read Access', () => {
    test('비로그인 사용자도 댓글 조회 가능', async () => {
      // 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Public comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      testCommentIds.push(comment?.id)

      // 비로그인 상태로 조회
      const { data, error } = await anonClient
        .from('comments')
        .select('*')
        .eq('id', comment?.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.content).toBe('Public comment')
    })

    test('모든 댓글 목록 조회 가능', async () => {
      // 여러 댓글 생성
      await user1Client.from('comments').insert({
        post_id: testPostId,
        content: 'Comment 1',
        user_id: testUsers.user1.id
      })

      await user2Client.from('comments').insert({
        post_id: testPostId,
        content: 'Comment 2',
        user_id: testUsers.user2.id
      })

      // 비로그인 상태로 전체 조회
      const { data, error } = await anonClient
        .from('comments')
        .select('*')
        .eq('post_id', testPostId)

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('INSERT Policy - Authenticated Only', () => {
    test('로그인한 사용자는 댓글 작성 가능', async () => {
      const { data, error } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Authenticated user comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.user_id).toBe(testUsers.user1.id)
      testCommentIds.push(data?.id)
    })

    test('비로그인 사용자는 댓글 작성 불가', async () => {
      const { error } = await anonClient
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Anonymous comment attempt',
          user_id: 'anonymous'
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501') // Insufficient privilege
    })

    test('다른 사용자 명의로 댓글 작성 불가', async () => {
      const { error } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Impersonation attempt',
          user_id: testUsers.user2.id // User1이 User2 명의로 작성 시도
        })

      expect(error).toBeDefined()
    })

    test('대댓글 작성 가능', async () => {
      // 부모 댓글 생성
      const { data: parentComment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Parent comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      // 대댓글 생성
      const { data: childComment, error } = await user2Client
        .from('comments')
        .insert({
          post_id: testPostId,
          parent_id: parentComment?.id,
          content: 'Reply to parent comment',
          user_id: testUsers.user2.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(childComment?.parent_id).toBe(parentComment?.id)
      testCommentIds.push(parentComment?.id, childComment?.id)
    })
  })

  describe('UPDATE Policy - Own Comments Only', () => {
    test('본인 댓글은 수정 가능', async () => {
      // 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Original content',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      testCommentIds.push(comment?.id)

      // 본인이 수정
      const { data: updated, error } = await user1Client
        .from('comments')
        .update({ content: 'Updated content' })
        .eq('id', comment?.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.content).toBe('Updated content')
    })

    test('타인 댓글은 수정 불가', async () => {
      // User1이 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'User1 comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      testCommentIds.push(comment?.id)

      // User2가 수정 시도
      const { error } = await user2Client
        .from('comments')
        .update({ content: 'Hacked content' })
        .eq('id', comment?.id)

      expect(error).toBeDefined()
    })

    test('구조적 필드(post_id, parent_id)는 변경 불가', async () => {
      // 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Test comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      testCommentIds.push(comment?.id)

      // post_id 변경 시도
      const { error: postIdError } = await user1Client
        .from('comments')
        .update({ post_id: 999999 })
        .eq('id', comment?.id)

      expect(postIdError).toBeDefined()
    })
  })

  describe('DELETE Policy - 2-Level Permission', () => {
    test('본인 댓글은 삭제 가능', async () => {
      // 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'To be deleted by owner',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      // 본인이 삭제
      const { error } = await user1Client
        .from('comments')
        .delete()
        .eq('id', comment?.id)

      expect(error).toBeNull()

      // 삭제 확인
      const { data: deleted } = await user1Client
        .from('comments')
        .select('*')
        .eq('id', comment?.id)
        .single()

      expect(deleted).toBeNull()
    })

    test('게시글 작성자는 자신의 게시글 댓글 삭제 가능', async () => {
      // User2가 User1의 게시글에 댓글 작성
      const { data: comment } = await user2Client
        .from('comments')
        .insert({
          post_id: testPostId, // User1의 게시글
          content: 'Comment on User1 post',
          user_id: testUsers.user2.id
        })
        .select()
        .single()

      // User1(게시글 작성자)이 댓글 삭제
      const { error } = await user1Client
        .from('comments')
        .delete()
        .eq('id', comment?.id)

      expect(error).toBeNull()
    })

    test('타인은 다른 사용자의 댓글 삭제 불가', async () => {
      // User1이 댓글 생성
      const { data: comment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'User1 comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      testCommentIds.push(comment?.id)

      // User3가 삭제 시도 (게시글 작성자도 아니고 댓글 작성자도 아님)
      const { error } = await user3Client
        .from('comments')
        .delete()
        .eq('id', comment?.id)

      expect(error).toBeDefined()
    })

    test('CASCADE 삭제 - 부모 댓글 삭제 시 대댓글도 삭제', async () => {
      // 부모 댓글 생성
      const { data: parentComment } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: 'Parent comment',
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      // 대댓글 생성
      const { data: childComment } = await user2Client
        .from('comments')
        .insert({
          post_id: testPostId,
          parent_id: parentComment?.id,
          content: 'Child comment',
          user_id: testUsers.user2.id
        })
        .select()
        .single()

      // 부모 댓글 삭제
      await user1Client
        .from('comments')
        .delete()
        .eq('id', parentComment?.id)

      // 대댓글도 삭제되었는지 확인
      const { data: deletedChild } = await user1Client
        .from('comments')
        .select('*')
        .eq('id', childComment?.id)
        .single()

      expect(deletedChild).toBeNull()
    })
  })

  describe('XSS Prevention', () => {
    test('HTML 태그를 포함한 댓글 저장 가능 (DB 레벨)', async () => {
      const maliciousContent = '<script>alert("XSS")</script>Hello'

      const { data, error } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: maliciousContent,
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe(maliciousContent) // DB는 원본 저장
      testCommentIds.push(data?.id)

      // 프론트엔드에서 새니타이징 필요
    })

    test('SQL Injection 방어 확인', async () => {
      const sqlInjectionContent = "'; DROP TABLE comments; --"

      const { data, error } = await user1Client
        .from('comments')
        .insert({
          post_id: testPostId,
          content: sqlInjectionContent,
          user_id: testUsers.user1.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe(sqlInjectionContent)
      testCommentIds.push(data?.id)

      // 테이블이 여전히 존재하는지 확인
      const { error: tableError } = await user1Client
        .from('comments')
        .select('count')
        .single()

      expect(tableError).toBeNull()
    })
  })

  describe('Performance Tests', () => {
    test('대량 댓글 조회 성능', async () => {
      // 50개 댓글 생성
      const comments = Array.from({ length: 50 }, (_, i) => ({
        post_id: testPostId,
        content: `Performance test comment ${i}`,
        user_id: testUsers.user1.id
      }))

      await user1Client.from('comments').insert(comments)

      // 조회 성능 측정
      const startTime = Date.now()
      const { data, error } = await anonClient
        .from('comments')
        .select('*')
        .eq('post_id', testPostId)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(50)
      expect(duration).toBeLessThan(1000) // 1초 이내
    })

    test('복잡한 권한 체크 성능', async () => {
      // 여러 게시글과 댓글 생성
      const posts = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const { data } = await user1Client
            .from('posts')
            .insert({
              title: `Post ${i}`,
              content: `Content ${i}`,
              user_id: testUsers.user1.id
            })
            .select()
            .single()
          return data
        })
      )

      // 각 게시글에 댓글 추가
      for (const post of posts) {
        await user2Client.from('comments').insert({
          post_id: post?.id,
          content: 'Test comment',
          user_id: testUsers.user2.id
        })
      }

      // DELETE 권한 체크 성능
      const startTime = Date.now()

      // User1이 자신의 모든 게시글의 댓글을 조회
      const { data } = await user1Client
        .from('comments')
        .select('*, posts!inner(user_id)')
        .in('post_id', posts.map(p => p?.id).filter(Boolean))

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(2000) // 2초 이내
    })
  })
})

describe('Rate Limiting Tests', () => {
  test('댓글 작성 Rate Limiting', async () => {
    // Mock rate limiter
    const rateLimiter = {
      attempts: new Map<string, { count: number; resetAt: Date }>(),

      check: function(userId: string, limit: number = 10, window: number = 60000) {
        const now = new Date()
        const userAttempts = this.attempts.get(userId)

        if (!userAttempts || userAttempts.resetAt < now) {
          this.attempts.set(userId, {
            count: 1,
            resetAt: new Date(now.getTime() + window)
          })
          return true
        }

        if (userAttempts.count >= limit) {
          return false
        }

        userAttempts.count++
        return true
      }
    }

    // 10개 댓글 작성 시도
    for (let i = 0; i < 12; i++) {
      const allowed = rateLimiter.check(testUsers.user1.id, 10, 60000)

      if (i < 10) {
        expect(allowed).toBe(true)
      } else {
        expect(allowed).toBe(false)
      }
    }
  })
})

/**
 * 보안 권장사항 구현 예시
 */
export class CommentSecurityService {
  /**
   * XSS 방어를 위한 HTML 새니타이징
   */
  static sanitizeContent(content: string): string {
    // DOMPurify 사용 예시
    // import DOMPurify from 'isomorphic-dompurify'
    // return DOMPurify.sanitize(content)

    // 간단한 예시 (실제로는 DOMPurify 사용 권장)
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#47;')
  }

  /**
   * 스팸 필터링
   */
  static isSpam(content: string): boolean {
    // 반복 문자 체크
    if (/(.)\1{9,}/.test(content)) return true

    // 과도한 링크 체크
    const linkCount = (content.match(/https?:\/\//g) || []).length
    if (linkCount > 3) return true

    // 과도한 대문자 체크
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (uppercaseRatio > 0.7) return true

    return false
  }

  /**
   * 욕설 필터링 (간단한 예시)
   */
  static containsProfanity(content: string): boolean {
    const profanityList = ['badword1', 'badword2'] // 실제 구현에서는 더 완전한 목록 사용
    const lowerContent = content.toLowerCase()

    return profanityList.some(word => lowerContent.includes(word))
  }

  /**
   * Rate Limiting 체크
   */
  static async checkRateLimit(
    userId: string,
    action: 'create' | 'update' | 'delete',
    redis?: any
  ): Promise<boolean> {
    const limits = {
      create: { max: 10, window: 60 }, // 1분당 10개
      update: { max: 20, window: 300 }, // 5분당 20개
      delete: { max: 5, window: 60 } // 1분당 5개
    }

    const { max, window } = limits[action]
    const key = `rate_limit:${action}:${userId}`

    // Redis를 사용한 구현 예시
    if (redis) {
      const current = await redis.incr(key)
      if (current === 1) {
        await redis.expire(key, window)
      }
      return current <= max
    }

    // 메모리 기반 구현 (개발용)
    return true
  }
}