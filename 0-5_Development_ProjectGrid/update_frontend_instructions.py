#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Frontend 작업 지시서를 HTML 프로토타입 기반으로 업데이트
"""

from pathlib import Path

# HTML 프로토타입 매핑
PROTOTYPE_MAPPING = {
    # Phase 1
    "P1F1": {
        "name": "전역 레이아웃",
        "prototype": "base-template.html (헤더/푸터)",
        "details": [
            "HTML 프로토타입의 헤더 구조 그대로 변환",
            "PoliticianFinder 로고, 캐치프레이즈",
            "네비게이션: 홈, 정치인, 커뮤니티, 연결",
            "알림 아이콘 (빨간색 뱃지)",
            "로그인/회원가입 버튼",
            "모바일 햄버거 메뉴",
            "푸터: 주황색 배경 (#f97316)",
            "서비스 소개, 이용약관, 개인정보처리방침, 고객센터 링크"
        ]
    },
    "P1F2": {
        "name": "홈 페이지",
        "prototype": "index.html",
        "details": [
            "HTML 프로토타입 index.html을 Next.js로 변환",
            "히어로 섹션: 검색 바, AI 평가 소개",
            "서비스 소개 섹션",
            "최신 정치인 카드 슬라이더",
            "모든 스타일, 레이아웃, 컬러 동일하게 적용"
        ]
    },
    "P1F3": {
        "name": "회원가입 페이지",
        "prototype": "signup.html",
        "details": [
            "HTML 프로토타입 signup.html을 Next.js로 변환",
            "5개 필드: 이메일, 비밀번호, 비밀번호 확인, 닉네임, 실명",
            "3개 약관 체크박스 + 모달: 이용약관, 개인정보처리방침, 마케팅",
            "구글 소셜 로그인 버튼",
            "프로토타입의 폼 레이아웃, 스타일, 검증 로직 그대로 유지"
        ]
    },
    "P1F4": {
        "name": "로그인 페이지",
        "prototype": "login.html",
        "details": [
            "HTML 프로토타입 login.html을 Next.js로 변환",
            "이메일, 비밀번호 필드",
            "로그인 상태 유지 체크박스",
            "비밀번호 찾기 링크",
            "구글 소셜 로그인",
            "프로토타입의 폼 스타일 그대로 적용"
        ]
    },
    "P1F5": {
        "name": "대시보드 페이지",
        "prototype": "mypage.html 참조",
        "details": [
            "로그인 후 리다이렉트 페이지",
            "사용자 프로필 요약",
            "즐겨찾기 정치인 목록",
            "최근 활동 내역"
        ]
    },

    # Phase 2
    "P2F1": {
        "name": "정치인 목록 페이지",
        "prototype": "politicians.html",
        "details": [
            "HTML 프로토타입 politicians.html을 Next.js로 변환",
            "검색/필터: 10개 정당, 17개 지역, 6개 직책",
            "정렬: AI평점순, 회원평점순, 이름순",
            "정치인 카드 그리드: 프로필 이미지, AI평점, 회원평점, 등급, 즐겨찾기",
            "무한 스크롤 또는 페이지네이션",
            "프로토타입의 필터 UI, 카드 디자인 동일하게 적용"
        ]
    },
    "P2F2": {
        "name": "정치인 상세 페이지",
        "prototype": "politician-detail.html",
        "details": [
            "HTML 프로토타입 politician-detail.html을 Next.js로 변환",
            "기본 정보: 사진, 이름, 정당, 지역, 직책",
            "AI 평가 점수 및 상세 분석",
            "회원 평가 및 리뷰",
            "경력/공약/법안 탭",
            "즐겨찾기 버튼",
            "프로토타입의 레이아웃, 탭 구조 동일하게 적용"
        ]
    },
    "P2F3": {
        "name": "검색 결과 페이지",
        "prototype": "search-results.html",
        "details": [
            "HTML 프로토타입 search-results.html을 Next.js로 변환",
            "통합 검색 결과",
            "정치인/게시글 탭 분리",
            "하이라이팅",
            "정렬 옵션"
        ]
    },

    # Phase 3
    "P3F1": {
        "name": "커뮤니티 메인 페이지",
        "prototype": "community.html",
        "details": [
            "HTML 프로토타입 community.html을 Next.js로 변환",
            "2개 게시판 탭: 정치인 게시판, 회원 게시판",
            "검색 바",
            "게시글 리스트: 제목, 작성자, 댓글 수, 좋아요",
            "프로토타입의 탭 UI, 게시글 카드 디자인 동일하게 적용"
        ]
    },
    "P3F2": {
        "name": "게시글 작성 페이지 (회원)",
        "prototype": "write-post_member.html",
        "details": [
            "HTML 프로토타입 write-post_member.html을 Next.js로 변환",
            "제목, 본문 입력",
            "이미지 업로드",
            "카테고리 선택",
            "임시저장 기능"
        ]
    },
    "P3F3": {
        "name": "게시글 작성 페이지 (정치인)",
        "prototype": "write-post_politician.html",
        "details": [
            "HTML 프로토타입 write-post_politician.html을 Next.js로 변환",
            "정치인 전용 글쓰기 UI",
            "공약/활동 보고 템플릿",
            "인증 배지 표시"
        ]
    },
    "P3F4": {
        "name": "게시글 상세 페이지 (회원)",
        "prototype": "post-detail_member.html",
        "details": [
            "HTML 프로토타입 post-detail_member.html을 Next.js로 변환",
            "게시글 본문",
            "댓글 시스템",
            "좋아요/공유 버튼",
            "신고 기능"
        ]
    },
    "P3F5": {
        "name": "게시글 상세 페이지 (정치인)",
        "prototype": "post-detail_politician.html",
        "details": [
            "HTML 프로토타입 post-detail_politician.html을 Next.js로 변환",
            "정치인 작성 게시글 전용 레이아웃",
            "인증 배지 표시",
            "공식 답변 하이라이팅"
        ]
    },
    "P3F6": {
        "name": "알림 페이지",
        "prototype": "notifications.html",
        "details": [
            "HTML 프로토타입 notifications.html을 Next.js로 변환",
            "알림 리스트: 댓글, 좋아요, 팔로우, 시스템",
            "읽음/안 읽음 상태",
            "필터 옵션",
            "전체 읽음 처리"
        ]
    },

    # Phase 4
    "P4F1": {
        "name": "마이페이지",
        "prototype": "mypage.html",
        "details": [
            "HTML 프로토타입 mypage.html을 Next.js로 변환",
            "프로필 요약",
            "즐겨찾기 정치인",
            "내가 쓴 글/댓글",
            "활동 통계"
        ]
    },
    "P4F2": {
        "name": "프로필 수정 페이지",
        "prototype": "profile-edit.html",
        "details": [
            "HTML 프로토타입 profile-edit.html을 Next.js로 변환",
            "프로필 이미지 업로드",
            "닉네임, 소개글 수정",
            "관심 정당/지역 설정"
        ]
    },
    "P4F3": {
        "name": "설정 페이지",
        "prototype": "settings.html",
        "details": [
            "HTML 프로토타입 settings.html을 Next.js로 변환",
            "알림 설정",
            "개인정보 보호",
            "계정 관리",
            "탈퇴 기능"
        ]
    },
    "P4F4": {
        "name": "즐겨찾기 페이지",
        "prototype": "favorite-politicians.html",
        "details": [
            "HTML 프로토타입 favorite-politicians.html을 Next.js로 변환",
            "즐겨찾기 정치인 목록",
            "그룹 관리",
            "즐겨찾기 해제"
        ]
    },

    # Phase 5
    "P5F1": {
        "name": "연결 서비스 메인 페이지",
        "prototype": "services.html",
        "details": [
            "HTML 프로토타입 services.html을 Next.js로 변환",
            "계좌이체, 서비스 중계 메뉴",
            "서비스 소개 카드"
        ]
    },
    "P5F2": {
        "name": "계좌이체 페이지",
        "prototype": "account-transfer.html",
        "details": [
            "HTML 프로토타입 account-transfer.html을 Next.js로 변환",
            "수취인 선택 (정치인)",
            "금액 입력",
            "결제 수단 선택"
        ]
    },
    "P5F3": {
        "name": "서비스 중계 페이지",
        "prototype": "service-relay.html",
        "details": [
            "HTML 프로토타입 service-relay.html을 Next.js로 변환",
            "외부 서비스 연결",
            "OAuth 인증"
        ]
    },
    "P5F4": {
        "name": "정치인 연결 페이지",
        "prototype": "connection.html",
        "details": [
            "HTML 프로토타입 connection.html을 Next.js로 변환",
            "정치인 1:1 소통",
            "질의응답 폼"
        ]
    },

    # Phase 6
    "P6F1": {
        "name": "결제 페이지",
        "prototype": "payment.html",
        "details": [
            "HTML 프로토타입 payment.html을 Next.js로 변환",
            "결제 수단 선택",
            "결제 정보 입력",
            "영수증 발급"
        ]
    },
    "P6F2": {
        "name": "결제 내역 페이지",
        "prototype": "mypage.html 내 결제내역 섹션",
        "details": [
            "결제 내역 목록",
            "영수증 다운로드",
            "환불 신청"
        ]
    },

    # Phase 7
    "P7F1": {
        "name": "관리자 대시보드",
        "prototype": "admin.html",
        "details": [
            "HTML 프로토타입 admin.html을 Next.js로 변환",
            "통계 차트",
            "사용자 관리",
            "콘텐츠 관리",
            "신고 처리"
        ]
    },
    "P7F2": {
        "name": "고객센터 페이지",
        "prototype": "support.html",
        "details": [
            "HTML 프로토타입 support.html을 Next.js로 변환",
            "FAQ",
            "1:1 문의",
            "공지사항"
        ]
    },
    "P7F3": {
        "name": "이용약관 페이지",
        "prototype": "terms.html",
        "details": [
            "HTML 프로토타입 terms.html을 Next.js로 변환",
            "이용약관 전문"
        ]
    },
    "P7F4": {
        "name": "개인정보처리방침 페이지",
        "prototype": "privacy.html",
        "details": [
            "HTML 프로토타입 privacy.html을 Next.js로 변환",
            "개인정보처리방침 전문"
        ]
    }
}

def create_instruction_template(task_id, task_info):
    """프로토타입 기반 작업 지시서 생성"""

    phase = task_id[1]
    area = task_id[2:].rstrip('0123456789')
    num = task_id[len(f"P{phase}{area}"):]

    template = f"""# 작업지시서: {task_id}

## 📋 기본 정보

- **작업 ID**: {task_id}
- **업무명**: {task_info['name']}
- **Phase**: Phase {phase}
- **Area**: Frontend (F)
- **서브 에이전트**: ui-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

{task_info['name']} 작업을 완료하여 프로젝트의 Frontend 영역 개발을 진행합니다.

**⚠️ 중요: 반드시 HTML 프로토타입을 기반으로 구현**

---

## 📐 HTML 프로토타입 참조

**기준 파일**: `0-2_UIUX_Design/prototypes/html/pages/{task_info['prototype']}`

**변환 규칙**:
1. HTML 프로토타입의 구조를 그대로 유지
2. Tailwind CSS 클래스 그대로 사용
3. 컬러 테마 동일하게 적용:
   - Primary: #f97316 (주황색)
   - Secondary: #8b5cf6 (보라색)
   - Accent: #00D26A (녹색)
4. 폰트: Noto Sans KR
5. 반응형 레이아웃 그대로 유지
6. JavaScript 인터랙션을 React 이벤트로 변환

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Glob

[기술 스택]
React, Next.js 14 (App Router), TailwindCSS, TypeScript

[전문 스킬]
ui-builder, fullstack-dev
```

---

## 📦 기대 결과물

다음 파일을 생성하세요:

```
1_Frontend/src/app/[task_id 경로]/page.tsx
```

---

## 📝 상세 구현 사항

**HTML 프로토타입에서 반드시 포함해야 할 요소**:

"""

    for i, detail in enumerate(task_info['details'], 1):
        template += f"{i}. {detail}\n"

    template += f"""
---

## ✅ 완료 기준

- [ ] HTML 프로토타입의 모든 요소가 Next.js로 변환됨
- [ ] 컬러, 폰트, 레이아웃이 프로토타입과 동일
- [ ] 반응형 레이아웃이 정상 작동
- [ ] TypeScript 타입 체크 통과
- [ ] 빌드 에러 없음
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: HTML 프로토타입 기반 재생성
**PROJECT GRID Version**: v5.0 (Prototype-Based)
"""

    return template

def main():
    """모든 Frontend 작업 지시서 업데이트"""

    script_dir = Path(__file__).parent
    tasks_dir = script_dir / "tasks"

    updated_count = 0

    for task_id, task_info in PROTOTYPE_MAPPING.items():
        file_path = tasks_dir / f"{task_id}.md"

        instruction = create_instruction_template(task_id, task_info)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(instruction)

        print(f"Updated: {task_id} - {task_info['name']}")
        updated_count += 1

    print(f"\nTotal updated: {updated_count} files")

if __name__ == "__main__":
    main()
