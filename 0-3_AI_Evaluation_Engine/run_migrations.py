"""
Supabase 마이그레이션 실행 스크립트
Migration 054 + 055 순차적으로 실행
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def run_migration_054():
    """
    Migration 054: ai_evaluations → ai_evaluation_scores 테이블 이름 변경
    """
    print("=" * 80)
    print("Migration 054: Rename ai_evaluations to ai_evaluation_scores")
    print("=" * 80)

    sqls = [
        # 1. 테이블 이름 변경
        """
        ALTER TABLE IF EXISTS ai_evaluations
        RENAME TO ai_evaluation_scores;
        """,

        # 2. 인덱스 이름 변경
        """
        ALTER INDEX IF EXISTS idx_ai_evaluations_politician
        RENAME TO idx_ai_evaluation_scores_politician;
        """,

        """
        ALTER INDEX IF EXISTS idx_ai_evaluations_category
        RENAME TO idx_ai_evaluation_scores_category;
        """,

        # 3. 테이블 설명 추가
        """
        COMMENT ON TABLE ai_evaluation_scores IS
        'V24 기본 방식: 각 AI가 자기가 수집한 뉴스만 평가한 결과';
        """
    ]

    for i, sql in enumerate(sqls, 1):
        try:
            result = supabase.rpc('exec_sql', {'sql': sql.strip()}).execute()
            print(f"✅ Step {i}/{len(sqls)}: Success")
        except Exception as e:
            print(f"⚠️ Step {i}/{len(sqls)}: {str(e)}")
            # 일부 오류는 무시 (이미 변경된 경우 등)
            if "does not exist" not in str(e).lower():
                raise

    print("\n✅ Migration 054 완료\n")

def run_migration_055():
    """
    Migration 055: ai_pooling_evaluation_scores 테이블 생성
    """
    print("=" * 80)
    print("Migration 055: Create ai_pooling_evaluation_scores")
    print("=" * 80)

    # 전체 SQL을 한 번에 실행
    sql = """
    -- 테이블 생성
    CREATE TABLE IF NOT EXISTS ai_pooling_evaluation_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- 정치인
      politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,

      -- 카테고리
      category TEXT NOT NULL,

      -- 3개 AI의 카테고리별 점수
      chatgpt_score FLOAT NOT NULL CHECK (chatgpt_score >= 0 AND chatgpt_score <= 100),
      grok_score FLOAT NOT NULL CHECK (grok_score >= 0 AND grok_score <= 100),
      claude_score FLOAT NOT NULL CHECK (claude_score >= 0 AND claude_score <= 100),

      -- 최종 평균 점수 (3개 AI 평균)
      final_score FLOAT NOT NULL CHECK (final_score >= 0 AND final_score <= 100),

      -- 메타데이터
      prompt_version TEXT DEFAULT 'v24.5',
      evaluated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),

      -- 중복 방지 (같은 정치인 + 카테고리 + 프롬프트 버전은 1개만)
      UNIQUE(politician_id, category, prompt_version)
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_ai_pooling_eval_scores_politician
    ON ai_pooling_evaluation_scores(politician_id);

    CREATE INDEX IF NOT EXISTS idx_ai_pooling_eval_scores_category
    ON ai_pooling_evaluation_scores(category);

    CREATE INDEX IF NOT EXISTS idx_ai_pooling_eval_scores_prompt_version
    ON ai_pooling_evaluation_scores(prompt_version);

    -- 복합 인덱스 (정치인 + 카테고리 조회 최적화)
    CREATE INDEX IF NOT EXISTS idx_ai_pooling_eval_scores_politician_category
    ON ai_pooling_evaluation_scores(politician_id, category);

    -- RLS (Row Level Security) 활성화
    ALTER TABLE ai_pooling_evaluation_scores ENABLE ROW LEVEL SECURITY;

    -- RLS 정책: 모든 사용자가 읽기 가능
    DROP POLICY IF EXISTS "Anyone can read ai_pooling_evaluation_scores" ON ai_pooling_evaluation_scores;
    CREATE POLICY "Anyone can read ai_pooling_evaluation_scores"
    ON ai_pooling_evaluation_scores
    FOR SELECT
    USING (true);

    -- RLS 정책: 인증된 사용자만 쓰기 가능 (관리자용)
    DROP POLICY IF EXISTS "Authenticated users can insert ai_pooling_evaluation_scores" ON ai_pooling_evaluation_scores;
    CREATE POLICY "Authenticated users can insert ai_pooling_evaluation_scores"
    ON ai_pooling_evaluation_scores
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can update ai_pooling_evaluation_scores" ON ai_pooling_evaluation_scores;
    CREATE POLICY "Authenticated users can update ai_pooling_evaluation_scores"
    ON ai_pooling_evaluation_scores
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- 테이블 설명
    COMMENT ON TABLE ai_pooling_evaluation_scores IS
    'V24.5 Pooling System: 3개 AI가 150개 뉴스를 교차 평가한 결과 (카테고리별)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.politician_id IS
    '정치인 ID (politicians.id 참조)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.category IS
    '평가 카테고리 (10개 중 1개)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.chatgpt_score IS
    'ChatGPT의 카테고리별 점수 (0-100)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.grok_score IS
    'Grok의 카테고리별 점수 (0-100)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.claude_score IS
    'Claude의 카테고리별 점수 (0-100)';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.final_score IS
    '최종 평균 점수 = (chatgpt_score + grok_score + claude_score) / 3';

    COMMENT ON COLUMN ai_pooling_evaluation_scores.prompt_version IS
    '프롬프트 버전 (기본값: v24.5)';
    """

    try:
        # Supabase Python 클라이언트는 직접 SQL 실행을 지원하지 않음
        # 대신 postgrest를 통해 실행
        print("⚠️ Supabase Python 클라이언트는 직접 SQL 실행을 지원하지 않습니다.")
        print("다음 방법 중 하나를 사용하세요:")
        print("\n1. Supabase 대시보드의 SQL Editor에서 실행")
        print("2. psql로 직접 연결하여 실행")
        print("\nSQL 파일 위치:")
        print("  - 0-4_Database/Supabase/migrations/054_rename_ai_evaluations_to_ai_evaluation_scores.sql")
        print("  - 0-4_Database/Supabase/migrations/055_create_ai_pooling_evaluation_scores.sql")

        return False

    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return False

def main():
    print("\n" + "=" * 80)
    print("Supabase 마이그레이션 실행")
    print("=" * 80)
    print("Migration 054: ai_evaluations → ai_evaluation_scores")
    print("Migration 055: ai_pooling_evaluation_scores 생성")
    print("=" * 80 + "\n")

    # Migration 054 실행
    try:
        run_migration_054()
    except Exception as e:
        print(f"❌ Migration 054 실패: {str(e)}")
        print("\n⚠️ 수동으로 Supabase 대시보드에서 실행해주세요.\n")
        return

    # Migration 055 실행
    run_migration_055()

    print("\n" + "=" * 80)
    print("마이그레이션 안내")
    print("=" * 80)
    print("\nSupabase 대시보드 (https://supabase.com)에서:")
    print("1. 프로젝트 선택")
    print("2. SQL Editor 메뉴로 이동")
    print("3. New query 클릭")
    print("4. 054번 SQL 붙여넣기 후 실행")
    print("5. 055번 SQL 붙여넣기 후 실행")
    print("\nSQL 파일 위치:")
    print("  - 0-4_Database/Supabase/migrations/054_rename_ai_evaluations_to_ai_evaluation_scores.sql")
    print("  - 0-4_Database/Supabase/migrations/055_create_ai_pooling_evaluation_scores.sql")
    print("=" * 80)

if __name__ == "__main__":
    main()
