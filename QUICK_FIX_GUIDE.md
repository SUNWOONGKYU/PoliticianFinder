# 🚀 즉시 실행: 데이터 표시 문제 빠른 해결

**작성 일시**: 2025-10-20 04:00
**증상**: 모의 데이터 삽입했지만 웹사이트에 아무것도 표시 안 됨
**예상 원인**: RLS 정책이 익명 사용자의 데이터 접근을 차단

---

## ⚡ 1분 안에 해결하기

### Step 1: Supabase SQL Editor 열기
```
https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/sql
```

### Step 2: 빠른 수정 SQL 실행
1. 파일 열기: `supabase/QUICK_FIX_DATA_DISPLAY.sql`
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. SQL Editor에 붙여넣기 (Ctrl+V)
4. **Run** 버튼 클릭

### Step 3: 결과 확인
성공 시 다음과 같은 메시지가 표시됩니다:
```
✅ 데이터 표시 문제 수정 완료!
이제 브라우저를 강력 새로고침(Ctrl+Shift+R) 하세요.
```

그리고 데이터 개수가 표시됩니다:
- politicians: 30
- ai_scores: 150
- posts: 50
- comments: 100
- politician_posts: 90

### Step 4: 웹사이트 확인
1. 브라우저에서 **Ctrl+Shift+R** (강력 새로고침)
2. 메인 페이지 확인: https://frontend-7sc7vhgza-finder-world.vercel.app
3. 데이터가 표시되는지 확인

---

## ✅ 예상 결과

### 메인 페이지
- **AI 랭킹**: 10명의 정치인 표시
- **HOT 게시글**: 15개 게시글 표시
- **정치인 최근 글**: 9개 글 표시
- **사이드바**: 통계 숫자 표시

### 정치인 목록 페이지 (/politicians)
- 30명의 정치인 카드 표시
- 각 카드에 AI 점수 표시

### 커뮤니티 페이지 (/community)
- 50개 게시글 목록 표시
- HOT 배지가 붙은 인기글 10개

---

## 🔍 만약 여전히 안 보인다면?

### 체크리스트
1. [ ] SQL 실행 시 에러 없었나요?
2. [ ] 브라우저 강력 새로고침 했나요? (Ctrl+Shift+R)
3. [ ] 시크릿 모드에서도 테스트해봤나요?
4. [ ] 브라우저 콘솔에 에러가 있나요? (F12 → Console 탭)

### 그래도 안 되면
`DIAGNOSE_DATA_ISSUE.sql` 파일을 실행하고 결과를 Claude Code에게 보여주세요.

---

## 📝 이 수정이 하는 일

1. **RLS 비활성화**: 테스트를 위해 임시로 모든 테이블의 RLS를 끕니다
2. **권한 부여**: 익명 사용자(anon)에게 모든 테이블/뷰의 SELECT 권한을 줍니다
3. **점수 계산**: Composite Score와 HOT Score를 수동으로 업데이트합니다
4. **검증**: 데이터가 제대로 들어있는지 확인합니다

---

## ⚠️ 중요 참고사항

이 수정은 **테스트 목적**으로 RLS를 완전히 비활성화합니다.

**프로덕션 배포 전에 반드시**:
- RLS를 다시 활성화하고
- 적절한 RLS 정책을 생성해야 합니다

자세한 내용은 `TROUBLESHOOT_NO_DATA_DISPLAY.md`의 "문제 2: RLS 정책" 섹션을 참고하세요.

---

**예상 소요 시간**: 1-2분
**난이도**: 매우 쉬움 (복사/붙여넣기만 하면 됨)
