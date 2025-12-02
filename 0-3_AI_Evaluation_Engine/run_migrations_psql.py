"""
PostgreSQL 직접 연결로 마이그레이션 실행
"""
import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

# 환경 변수 로드
load_dotenv()

def get_db_connection():
    """
    Supabase PostgreSQL 연결
    """
    # .env에서 직접 DB 연결 정보 가져오기
    db_host = os.getenv("SUPABASE_HOST")
    db_port = int(os.getenv("SUPABASE_PORT", "5432"))
    db_name = os.getenv("SUPABASE_DB", "postgres")
    db_user = os.getenv("SUPABASE_USER", "postgres")
    db_password = os.getenv("SUPABASE_PASSWORD")

    if not db_password:
        print("❌ SUPABASE_PASSWORD 환경 변수가 없습니다.")
        print("Supabase 대시보드 > Settings > Database > Connection string에서 비밀번호 확인")
        return None

    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ DB 연결 실패: {str(e)}")
        return None

def run_migration_054(conn):
    """
    Migration 054: ai_evaluations → ai_evaluation_scores 테이블 이름 변경
    """
    print("\n" + "=" * 80)
    print("Migration 054: Rename ai_evaluations to ai_evaluation_scores")
    print("=" * 80)

    sqls = [
        "ALTER TABLE IF EXISTS ai_evaluations RENAME TO ai_evaluation_scores;",
        "ALTER INDEX IF EXISTS idx_ai_evaluations_politician RENAME TO idx_ai_evaluation_scores_politician;",
        "ALTER INDEX IF EXISTS idx_ai_evaluations_category RENAME TO idx_ai_evaluation_scores_category;",
        "COMMENT ON TABLE ai_evaluation_scores IS 'V24 기본 방식: 각 AI가 자기가 수집한 뉴스만 평가한 결과';"
    ]

    cursor = conn.cursor()

    for i, sql in enumerate(sqls, 1):
        try:
            cursor.execute(sql)
            conn.commit()
            print(f"  ✅ Step {i}/{len(sqls)}: Success")
        except Exception as e:
            conn.rollback()
            error_msg = str(e)
            if "does not exist" in error_msg.lower():
                print(f"  ⚠️ Step {i}/{len(sqls)}: Already completed or not exists")
            else:
                print(f"  ❌ Step {i}/{len(sqls)}: {error_msg}")
                raise

    cursor.close()
    print("✅ Migration 054 완료\n")

def run_migration_055(conn):
    """
    Migration 055: ai_pooling_evaluation_scores 테이블 생성
    """
    print("=" * 80)
    print("Migration 055: Create ai_pooling_evaluation_scores")
    print("=" * 80)

    # 파일에서 SQL 읽기
    sql_file = "../0-4_Database/Supabase/migrations/055_create_ai_pooling_evaluation_scores.sql"

    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
    except FileNotFoundError:
        print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file}")
        return False

    cursor = conn.cursor()

    try:
        # 전체 SQL 실행
        cursor.execute(sql)
        conn.commit()
        print("  ✅ 테이블 생성 완료")
        print("  ✅ 인덱스 생성 완료")
        print("  ✅ RLS 정책 생성 완료")
        print("  ✅ 코멘트 추가 완료")

    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        if "already exists" in error_msg.lower():
            print("  ⚠️ 테이블이 이미 존재합니다")
        else:
            print(f"  ❌ 오류: {error_msg}")
            raise

    cursor.close()
    print("✅ Migration 055 완료\n")
    return True

def verify_tables(conn):
    """
    테이블 생성 확인
    """
    print("=" * 80)
    print("테이블 생성 검증")
    print("=" * 80)

    cursor = conn.cursor()

    # 테이블 존재 확인
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('ai_evaluation_scores', 'ai_pooling_evaluation_scores')
        ORDER BY table_name;
    """)

    tables = cursor.fetchall()

    for (table_name,) in tables:
        print(f"  ✅ {table_name}")

        # 컬럼 확인
        cursor.execute(f"""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        print(f"     컬럼 수: {len(columns)}개")

    cursor.close()
    print("\n✅ 검증 완료")

def main():
    print("\n" + "=" * 80)
    print("Supabase 마이그레이션 실행")
    print("=" * 80)
    print("Migration 054: ai_evaluations → ai_evaluation_scores")
    print("Migration 055: ai_pooling_evaluation_scores 생성")
    print("=" * 80)

    # DB 연결
    conn = get_db_connection()
    if not conn:
        print("\n⚠️ DB 연결 실패. .env에 다음 항목을 추가하세요:")
        print("SUPABASE_PASSWORD=<Supabase 데이터베이스 비밀번호>")
        print("\n비밀번호 확인:")
        print("1. Supabase 대시보드 > Settings > Database")
        print("2. Connection string 확인")
        return

    try:
        # Migration 054 실행
        run_migration_054(conn)

        # Migration 055 실행
        run_migration_055(conn)

        # 검증
        verify_tables(conn)

        print("\n" + "=" * 80)
        print("✅ 모든 마이그레이션 완료!")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ 마이그레이션 실패: {str(e)}")

    finally:
        conn.close()

if __name__ == "__main__":
    main()
