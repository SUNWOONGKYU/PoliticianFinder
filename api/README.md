# Politician Finder API

정치인 평가 및 커뮤니티 플랫폼 Backend API

## 기술 스택

- FastAPI 0.104.1
- SQLAlchemy 2.0
- PostgreSQL (프로덕션) / SQLite (개발)
- JWT 인증
- Pydantic 검증

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 필요한 값 수정
```

### 4. 서버 실행

```bash
uvicorn app.main:app --reload
```

서버 실행 후 http://localhost:8000 에서 확인

## API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 프로젝트 구조

```
api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── api/
│   │   └── v1/              # API v1 라우트
│   ├── core/
│   │   ├── config.py        # 설정
│   │   ├── security.py      # 보안 (JWT, 비밀번호)
│   │   └── database.py      # DB 연결
│   ├── models/              # SQLAlchemy 모델
│   ├── schemas/             # Pydantic 스키마
│   ├── services/            # 비즈니스 로직
│   ├── utils/               # 유틸리티
│   └── tests/               # 테스트
├── requirements.txt
├── .env.example
└── README.md
```

## 개발 가이드

### 새로운 API 추가

1. `models/`에 SQLAlchemy 모델 작성
2. `schemas/`에 Pydantic 스키마 작성
3. `services/`에 비즈니스 로직 작성
4. `api/v1/`에 라우트 작성
5. `main.py`에 라우터 등록

### 테스트 실행

```bash
pytest
```

## 라이센스

MIT
