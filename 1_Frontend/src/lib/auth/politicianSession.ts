// Politician Session Validation Helper
// 정치인 세션 토큰 검증 헬퍼 함수

import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

// politician_sessions 테이블 타입 정의 (database.types에 아직 없음)
interface PoliticianSession {
  id: string;
  politician_id: string;
  session_token: string;
  expires_at: string;
  last_used_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

type Politician = Database['public']['Tables']['politicians']['Row'];

/**
 * 정치인 세션 검증 결과 인터페이스
 */
export interface PoliticianSessionValidationResult {
  valid: boolean;
  politician?: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    politician_id: string;
    session_token: string;
    expires_at: string;
    last_used_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 정치인 세션 토큰 검증
 *
 * @param politicianId - 정치인 ID (8-char hex TEXT)
 * @param sessionToken - 세션 토큰 (64-char hex)
 * @returns 검증 결과 (valid, politician, session, error)
 *
 * @example
 * ```typescript
 * const result = await validatePoliticianSession(
 *   '17270f25',
 *   'a1b2c3d4...'
 * );
 *
 * if (!result.valid) {
 *   return NextResponse.json(
 *     { error: result.error },
 *     { status: 401 }
 *   );
 * }
 *
 * // result.politician, result.session 사용
 * ```
 */
export async function validatePoliticianSession(
  politicianId: string,
  sessionToken: string
): Promise<PoliticianSessionValidationResult> {
  try {
    // Admin client 생성 (RLS 우회)
    const supabase = createAdminClient();

    // 1. 세션 토큰 검증
    const { data: session, error: sessionError } = await supabase
      .from('politician_sessions')
      .select('*')
      .eq('politician_id', politicianId)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single() as { data: PoliticianSession | null; error: any };

    if (sessionError || !session) {
      return {
        valid: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다. 다시 로그인해주세요.',
        },
      };
    }

    // 2. 정치인 존재 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', politicianId)
      .single() as { data: Pick<Politician, 'id' | 'name'> | null; error: any };

    if (politicianError || !politician) {
      return {
        valid: false,
        error: {
          code: 'NOT_FOUND',
          message: '정치인 정보를 찾을 수 없습니다.',
        },
      };
    }

    // 3. 세션 last_used_at 업데이트 (비동기, 응답 대기 안 함)
    (supabase as any)
      .from('politician_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id)
      .then(() => {
        // 성공적으로 업데이트됨
      })
      .catch((err: any) => {
        console.error('[validatePoliticianSession] Failed to update last_used_at:', err);
      });

    // 4. 검증 성공
    return {
      valid: true,
      politician: {
        id: politician.id,
        name: politician.name,
      },
      session: {
        id: session.id,
        politician_id: session.politician_id,
        session_token: session.session_token,
        expires_at: session.expires_at,
        last_used_at: session.last_used_at,
      },
    };
  } catch (error) {
    console.error('[validatePoliticianSession] Unexpected error:', error);
    return {
      valid: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
      },
    };
  }
}
