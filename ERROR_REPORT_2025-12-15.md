# PoliticianFinder 오류 테스트 리포트

**테스트 일시**: 2025-12-15 00:32 KST
**테스트 URL**: https://politician-finder-futug94oy-finder-world.vercel.app
**테스트 계정**: wksun999@naver.com

---

## 테스트 결과 요약

### Public API 테스트 (로그인 불필요)

| 카테고리 | 테스트 | 결과 | 비고 |
|---------|-------|------|------|
| 정치인검색 | 이름 검색 "오세훈" | ✅ 성공 | 1개 결과, ID 포함 |
| 정치인검색 | 정당 검색 "국민의힘" | ✅ 성공 | 10개 결과, ID 포함 |
| 정치인검색 | 정당 검색 "더불어민주당" | ✅ 성공 | 10개 결과, ID 포함 |
| 정치인검색 | 지역 검색 "서울" | ✅ 성공 | 1개 결과, ID 포함 |
| 정치인 | 목록 조회 | ✅ 성공 | 5개 정치인 |
| 정치인 | 상세 조회 | ✅ 성공 | ID: 60e55d2a, 이름: 김도읍 |
| 게시글 | 목록 조회 | ✅ 성공 | 5개, **users 조인 있음** |
| 게시글 | 상세 조회 | ✅ 성공 | **users: 선웅규** (실제 닉네임 표시) |
| 커뮤니티 | 게시글 목록 | ✅ 성공 | 5개, **users 조인 있음** |
| 인증필요 | /api/auth/me | ✅ 성공 | 401 Unauthorized 정상 반환 |
| 인증필요 | /api/favorites | ✅ 성공 | 401 Unauthorized 정상 반환 |
| 인증필요 | POST /api/posts | ✅ 성공 | 401 Unauthorized 정상 반환 |

**Public API 결과: 12/12 (100%) 성공**

---

### 로그인 테스트

| 테스트 | 결과 | 에러 메시지 |
|-------|------|------------|
| wksun999@naver.com 로그인 | ❌ 실패 | 이메일 또는 비밀번호가 올바르지 않습니다. |

**가능한 원인**:
1. Supabase Auth에 계정이 등록되지 않음
2. 이메일 인증이 완료되지 않음
3. 비밀번호 불일치

---

## 이번 세션에서 수정된 버그

### 1. 정치인 검색 API JSONB 오류 ✅ 수정완료

**증상**: 정치인 검색 시 500 오류
```
operator does not exist: jsonb ~~* unknown
```

**원인**: `career` 컬럼이 JSONB 타입인데 ilike 연산자 사용

**수정 내용**:
- 파일: `/api/politicians/search/route.ts`
- `career` 컬럼을 검색 대상에서 제외
- TEXT 타입 컬럼만 검색 (name, name_en, party, position)

**검증**: ✅ 정치인 검색 API 4개 테스트 모두 통과

---

### 2. 게시글 작성자 "투표하는 시민" 표시 오류 ✅ 수정완료

**증상**: 게시글 작성자가 항상 "투표하는 시민"으로 표시됨

**원인**:
- API에서 `profiles` 테이블 조인 시도 (존재하지 않는 테이블)
- 프론트엔드에서 샘플 닉네임 배열 사용

**수정 내용**:
- `/api/posts/route.ts`: profiles → users 테이블 조인으로 변경
- `/api/posts/[id]/route.ts`: users 테이블 조인 추가
- `/api/community/posts/route.ts`: profiles → users 테이블 조인으로 변경
- `/community/posts/[id]/page.tsx`: `postData.users?.nickname` 사용하도록 수정
- `/community/page.tsx`: `post.users` 사용하도록 수정

**검증**: ✅ 게시글 상세 API에서 "users: 선웅규" 표시 (실제 닉네임)

---

### 3. 공감/공유 버튼 작동 안 함 ✅ 수정완료

**증상**: 공감(좋아요) 버튼 클릭해도 저장되지 않음

**원인**: 버튼이 로컬 state만 업데이트하고 API 호출하지 않음

**수정 내용**:
- `/community/posts/[id]/page.tsx`: handleUpvote/handleDownvote 함수에서 `/api/votes` API 호출 추가

---

### 4. 회원가입 오류 메시지 상세화 ✅ 수정완료

**증상**: 회원가입 오류 시 구체적인 이유 표시 안 됨

**수정 내용**:
- `/api/auth/signup/route.ts`: 오류 유형별 상세 메시지 추가
- `/auth/signup/page.tsx`: 오류 상세 내용 표시 UI 추가

---

## 미해결 이슈

### 1. 로그인 테스트 실패

**상태**: 🔍 조사 필요

**증상**: 제공된 계정(wksun999@naver.com)으로 로그인 실패

**확인 필요 사항**:
1. Supabase 대시보드에서 해당 이메일로 가입된 계정 존재 여부 확인
2. 이메일 인증 완료 여부 확인
3. 비밀번호 정확성 확인

**권장 조치**:
- Supabase 대시보드 → Authentication → Users에서 계정 확인
- 필요시 비밀번호 재설정

---

### 2. 정치인 태깅 표시 ✅ 정상 작동 확인

**상태**: ✅ 해결됨

정치인 태그된 게시글 API 테스트 결과:
```
게시글 ID: fe883918-295b-49f8-9f01-6c4eee17c46b
제목: [서울시장 오세훈] 2025년 서울시 주요 정책 안내
politician_id: 62e7b453
politicians: {
  "name": "오세훈",
  "party": "국민의힘",
  "status": "현직",
  "position": "서울특별시장"
}
```

**API 확인**: 정치인 태그된 게시글 5개 확인, 모두 `politicians` 정보 정상 반환

**프론트엔드**: `/community/posts/[id]/page.tsx` 646-665줄에서 정치인 태그 표시
- 주황색 배경의 "🏛️ 관련 정치인:" 박스로 표시
- 정치인 이름 클릭 시 정치인 상세 페이지로 이동

---

## 수정된 파일 목록

1. `1_Frontend/src/app/api/politicians/search/route.ts`
2. `1_Frontend/src/app/api/posts/route.ts`
3. `1_Frontend/src/app/api/posts/[id]/route.ts`
4. `1_Frontend/src/app/api/community/posts/route.ts`
5. `1_Frontend/src/app/community/posts/[id]/page.tsx`
6. `1_Frontend/src/app/community/page.tsx`
7. `1_Frontend/src/app/api/auth/signup/route.ts`
8. `1_Frontend/src/app/auth/signup/page.tsx`

---

## 다음 단계 권장사항

1. **로그인 계정 확인**: Supabase에서 wksun999@naver.com 계정 상태 확인
2. **정치인 태그 테스트**: 정치인이 태그된 게시글 작성 후 표시 여부 재확인
3. **공감/공유 실제 테스트**: 로그인 후 공감 버튼 클릭해서 저장 여부 확인

---

**테스트 완료**
