# PDF 생성 도구 사용법

## 빠른 사용법

```bash
python markdown_to_pdf.py 파일명.md
```

## 예시

```bash
# 조은희 보고서를 PDF로 변환
python markdown_to_pdf.py 조은희_20260206_완성본.md

# 다른 보고서를 PDF로 변환
python markdown_to_pdf.py 김민석_20260206_완성본.md
```

## 결과

- `파일명.html` 생성 (중간 파일)
- `파일명.pdf` 생성 (최종 파일)

## 필수 도구

이 스크립트는 다음 도구를 사용합니다:

1. **pandoc** - Markdown을 HTML로 변환
   - 이미 설치되어 있음

2. **wkhtmltopdf** - HTML을 PDF로 변환
   - 이미 설치되어 있음

## 파일 구조

```
보고서/
├── markdown_to_pdf.py          (이 도구)
├── PDF생성_사용법.md            (이 파일)
├── 조은희_20260206_완성본.md    (원본 Markdown)
├── 조은희_V40_평가보고서_20260206.html  (중간 파일)
└── 조은희_V40_평가보고서_20260206.pdf   (최종 파일)
```

## 기술 세부사항

### pandoc 옵션
- `--standalone`: 완전한 HTML 문서 생성
- `--css`: GitHub Markdown 스타일 적용
- `--metadata title`: PDF 제목 설정

### wkhtmltopdf 옵션
- `--encoding utf-8`: 한글 인코딩
- `--page-size A4`: A4 용지 크기
- `--margin-*`: 여백 20mm

## 문제 해결

### pandoc 없음
```bash
# Windows (Chocolatey)
choco install pandoc -y
```

### wkhtmltopdf 없음
```bash
# Windows (Chocolatey)
choco install wkhtmltopdf -y
```

---

**작성일**: 2026-02-06
**버전**: 1.0
