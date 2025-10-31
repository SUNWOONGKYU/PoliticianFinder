# V6.2 스키마 설치 가이드

## 방법 1: Supabase 대시보드 (권장)

1. https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/sql 접속
2. SQL Editor 열기
3. `schema_v6.2.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭

---

## 방법 2: psql 명령줄

```bash
psql "postgresql://postgres.ooddlafwdpzgxfefgsrx:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f schema_v6.2.sql
```

---

## 설치 확인

설치 후 다음 명령으로 확인:

```python
python -c "
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

tables = ['collected_data', 'ai_item_scores', 'ai_category_scores', 'ai_final_scores']
for table in tables:
    try:
        count = supabase.table(table).select('*', count='exact').limit(0).execute()
        print(f'OK: {table} ({count.count} rows)')
    except:
        print(f'MISSING: {table}')
"
```

---

## 설치될 테이블

1. **collected_data** - 수집된 데이터 (Rating)
2. **ai_item_scores** - 항목 점수 (4.0~10.0)
3. **ai_category_scores** - 분야 점수 (40~100)
4. **ai_final_scores** - 최종 점수 + 등급 (400~1,000)
5. **combined_final_scores** - AI 통합 점수

## 자동 트리거

- `trg_calculate_ai_item_score` - collected_data INSERT 시 자동 계산
- `trg_calculate_ai_category_score` - ai_item_scores INSERT/UPDATE 시 자동 계산
- `trg_calculate_ai_final_score` - ai_category_scores INSERT/UPDATE 시 자동 계산 (10개 완료 시)
- `trg_update_combined_score` - ai_final_scores INSERT/UPDATE 시 통합 점수 계산
