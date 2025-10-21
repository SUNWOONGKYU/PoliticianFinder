# 색상 커스터마이징 가이드

## 개요
`colors.json` 파일을 수정하여 Excel 파일의 색상 테마를 변경할 수 있습니다.

---

## 색상 코드 형식

**6자리 HEX 코드** 형식을 사용합니다 (# 기호 제외):
- ✅ 올바른 형식: `"BBDEFB"`, `"E3F2FD"`, `"FFFFFF"`
- ❌ 잘못된 형식: `"#BBDEFB"`, `"blue"`, `"rgb(187, 222, 251)"`

### 색상 찾기 도구
- https://htmlcolorcodes.com/
- https://www.color-hex.com/
- Google에서 "color picker" 검색

---

## colors.json 구조

### 1. Phase별 색상
Phase 1~5 헤더 행의 배경색

```json
"phase": {
  "phase1": "BBDEFB",  // 파란색
  "phase2": "C8E6C9",  // 초록색
  "phase3": "FFF9C4",  // 노란색
  "phase4": "FFE0B2",  // 주황색
  "phase5": "FFCDD2"   // 빨간색
}
```

### 2. 영역별 색상
Frontend, Backend 등 영역 행의 배경색

```json
"area": {
  "Frontend": "E3F2FD",    // 하늘색
  "Backend": "F1F8E9",     // 연두색
  "Database": "FFF8E1",    // 노란색
  "Test": "F3E5F5",        // 보라색
  "DevOps": "ECEFF1",      // 회색
  "AI/ML": "FCE4EC"        // 분홍색
}
```

### 3. 진도율 색상
0%, 25%, 50%, 75%, 100% 배경색

```json
"progress": {
  "0%": "FFFFFF",      // 흰색
  "25%": "E0E0E0",     // 연한 회색
  "50%": "BDBDBD",     // 회색
  "75%": "757575",     // 진한 회색
  "100%": "4CAF50"     // 녹색
}
```

### 4. 상태 색상
대기, 진행중, 검토중, 완료, 보류 배경색

```json
"state": {
  "대기": "FFFFFF",        // 흰색
  "진행중": "E3F2FD",      // 연한 파란색
  "검토중": "FFF3E0",      // 연한 주황색
  "완료": "E8F5E9",        // 연한 녹색
  "보류": "FFEBEE"         // 연한 빨간색
}
```

### 5. 의존작업 색상

```json
"dependency": {
  "없음": "FFFFFF",        // 흰색
  "있음": "FFF3E0"         // 연한 주황색
}
```

### 6. 블로커 색상

```json
"blocker": {
  "없음": "FFFFFF",              // 흰색
  "의존성 대기": "FFF3E0",       // 연한 주황
  "기술 이슈": "FFEBEE",         // 연한 빨강
  "요구사항 불명확": "FFF9C4",   // 연한 노랑
  "외부 의존": "E1F5FE"          // 연한 파랑
}
```

### 7. 작업 행 색상
작업ID와 업무 행의 배경색

```json
"task": {
  "작업ID": "E1F5FE",      // 연한 파란색
  "업무": "FFF9C4"          // 연한 노란색
}
```

### 8. 기타 색상

```json
"other": {
  "header": "B0BEC5"       // 헤더 배경 (회색)
}
```

---

## 색상 변경 방법

### 1단계: colors.json 파일 열기
```
G:\내 드라이브\Developement\PoliticianFinder\6D-GCDM_Grid\automation\colors.json
```

### 2단계: 원하는 색상 코드로 수정
예: Phase 1을 보라색으로 변경
```json
"phase": {
  "phase1": "E1BEE7",  // 보라색으로 변경
  "phase2": "C8E6C9",
  ...
}
```

### 3단계: 파일 저장

### 4단계: Excel 재생성
```bash
python csv_to_excel_with_colors.py project_grid_v1.0_XY.csv
```

### 5단계: 결과 확인
`project_grid_v1.0_XY.xlsx` 파일을 열어서 색상 확인

---

## 색상 테마 예시

### 다크 모드 테마
```json
"state": {
  "대기": "37474F",        // 어두운 회색
  "진행중": "546E7A",      // 청회색
  "검토중": "FF6F00",      // 주황색
  "완료": "2E7D32",        // 진한 녹색
  "보류": "C62828"         // 진한 빨간색
}
```

### 파스텔 테마
```json
"phase": {
  "phase1": "E1F5FE",  // 아주 연한 파란색
  "phase2": "F1F8E9",  // 아주 연한 초록색
  "phase3": "FFFDE7",  // 아주 연한 노란색
  "phase4": "FFF3E0",  // 아주 연한 주황색
  "phase5": "FCE4EC"   // 아주 연한 분홍색
}
```

### 모노크롬 테마
```json
"state": {
  "대기": "FFFFFF",        // 흰색
  "진행중": "E0E0E0",      // 연한 회색
  "검토중": "BDBDBD",      // 회색
  "완료": "757575",        // 진한 회색
  "보류": "424242"         // 아주 진한 회색
}
```

---

## 주의사항

### ⚠️ JSON 형식 오류
- **쉼표(,) 주의**: 마지막 항목 뒤에는 쉼표 없음
  ```json
  // ❌ 잘못된 예
  {
    "phase1": "BBDEFB",
    "phase2": "C8E6C9",  // 마지막 항목에 쉼표
  }

  // ✅ 올바른 예
  {
    "phase1": "BBDEFB",
    "phase2": "C8E6C9"   // 마지막 항목은 쉼표 없음
  }
  ```

- **따옴표("")** 반드시 사용
  ```json
  // ❌ 잘못된 예
  {
    phase1: BBDEFB
  }

  // ✅ 올바른 예
  {
    "phase1": "BBDEFB"
  }
  ```

### ⚠️ 색상 선택 팁
- **가독성 우선**: 너무 진한 배경색은 텍스트 읽기 어려움
- **대비 확인**: 흰색 텍스트와 대비가 충분한지 확인
- **일관성**: 비슷한 의미는 비슷한 색상 계열 사용
  - 예: 진행 중 상태들은 파란색 계열
  - 문제/블로커는 빨간색 계열

---

## 트러블슈팅

### colors.json 로드 실패 시
Python 스크립트가 기본 색상을 자동으로 사용합니다.

에러 메시지 확인:
```
[WARNING] colors.json 파일을 찾을 수 없습니다. 기본 색상을 사용합니다.
[ERROR] colors.json 로드 실패: [에러 내용]. 기본 색상을 사용합니다.
```

### JSON 형식 검증
온라인 검증 도구:
- https://jsonlint.com/
- colors.json 내용을 복사해서 붙여넣고 "Validate JSON" 클릭

---

## 백업 및 복원

### 백업
색상을 변경하기 전에 원본 백업:
```bash
cp colors.json colors_backup.json
```

### 복원
문제 발생 시 백업 복원:
```bash
cp colors_backup.json colors.json
```

---

**작성일**: 2025-10-14
**버전**: v1.0
