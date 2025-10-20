# 종합 문제 해결 가이드

## 1. Vercel 환경변수 설정 (필수)

Vercel 대시보시 → Settings → Environment Variables → 다음 3개 추가:

```
NEXT_PUBLIC_SUPABASE_URL = https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU
```

## 2. Supabase RLS 정책 확인

Supabase → Authentication → Policies → posts 테이블

```sql
-- SELECT 정책 (anon 역할도 읽기 가능)
CREATE POLICY "Enable read access for all users"
ON posts
FOR SELECT
USING (true);
```

## 3. GitHub에 이미 푸시된 코드 수정사항

✅ vercel.json (루트 디렉토리 지정)
✅ API 쿼리 간소화 (join 제거, 필요한 컬럼만)
✅ 카테고리 enum 정정
✅ 모의 데이터 50개 삽입

## 4. 연결된 모든 문제

| 문제 | 원인 | 해결책 |
|------|------|------|
| DEPLOYMENT_NOT_FOUND | vercel.json 누락 | ✅ 복구됨 |
| 500 API 에러 | 환경변수 없음 | ⬜ Vercel 설정 필요 |
| 데이터 조회 실패 | RLS 정책 없음 | ⬜ Supabase 정책 필요 |
| 쿼리 타임아웃 | 복잡한 JOIN | ✅ 단순화됨 |
| 카테고리 불일치 | enum 오류 | ✅ 수정됨 |

## 다음 단계

1. **Vercel 환경변수 설정** (필수!)
2. **Supabase RLS 정책 설정** (필수!)
3. 5-10분 후 배포 완료
4. https://politician-finder-web.vercel.app/community 확인
