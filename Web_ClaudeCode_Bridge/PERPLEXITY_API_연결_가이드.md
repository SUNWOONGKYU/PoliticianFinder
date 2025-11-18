# 🔮 Perplexity API 연결 가이드

Dashboard에서 Perplexity AI에게 질문하고 답변을 받는 기능을 구현하는 방법입니다.

---

## 📋 목차

1. [Perplexity API 개요](#1-perplexity-api-개요)
2. [API 키 발급](#2-api-키-발급)
3. [API 연결 구조](#3-api-연결-구조)
4. [구현 방법](#4-구현-방법)
5. [보안 고려사항](#5-보안-고려사항)
6. [테스트 방법](#6-테스트-방법)
7. [문제 해결](#7-문제-해결)

---

## 1. Perplexity API 개요

### 1.1 API 엔드포인트

```
POST https://api.perplexity.ai/chat/completions
```

### 1.2 주요 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `model` | string | ✅ | 사용할 모델 (예: `llama-3.1-sonar-small-128k-online`) |
| `messages` | array | ✅ | 대화 메시지 배열 |
| `max_tokens` | number | ❌ | 응답 최대 토큰 수 |
| `temperature` | number | ❌ | 응답 창의성 (0.0 ~ 2.0) |
| `stream` | boolean | ❌ | 스트리밍 응답 여부 |

### 1.3 사용 가능한 모델

```javascript
// 온라인 모델 (실시간 웹 검색 가능)
"llama-3.1-sonar-small-128k-online"
"llama-3.1-sonar-large-128k-online"
"llama-3.1-sonar-huge-128k-online"

// 오프라인 모델 (웹 검색 없음)
"llama-3.1-sonar-small-128k-chat"
"llama-3.1-sonar-large-128k-chat"
```

---

## 2. API 키 발급

### 2.1 회원가입 및 로그인

1. https://www.perplexity.ai/ 접속
2. 계정 생성 또는 로그인
3. 설정 → API 섹션 이동

### 2.2 API 키 생성

1. "Create API Key" 버튼 클릭
2. API 키 이름 입력 (예: `SSALWorks_Dashboard`)
3. 생성된 API 키 복사 및 안전하게 보관

**⚠️ 중요:** API 키는 한 번만 표시되므로 반드시 복사해두세요!

### 2.3 요금제 확인

- **Free Tier**: 월 5,000 크레딧 (약 $5 상당)
- **Pro Tier**: 월 $20 (무제한 크레딧)
- 크레딧 사용량: https://www.perplexity.ai/settings/api 에서 확인

---

## 3. API 연결 구조

### 3.1 시스템 아키텍처

```
┌─────────────────────┐
│  Dashboard (HTML)   │
│                     │
│  [Perplexity에게    │
│   묻기 섹션]         │
│                     │
│  - 질문 입력        │
│  - 전송 버튼        │
└──────────┬──────────┘
           │ HTTP POST
           ↓
┌─────────────────────┐
│  Backend Server     │
│  (Node.js/Express)  │
│                     │
│  - API 키 관리      │
│  - 요청 처리        │
│  - 응답 전달        │
└──────────┬──────────┘
           │ HTTPS POST
           ↓
┌─────────────────────┐
│  Perplexity API     │
│                     │
│  https://api.       │
│  perplexity.ai      │
└─────────────────────┘
```

### 3.2 데이터 흐름

```
사용자 질문 → Dashboard → Backend → Perplexity API
                  ↑                          ↓
                  └────── 응답 ←─────────────┘
```

---

## 4. 구현 방법

### 4.1 환경 변수 설정

**.env 파일 생성**
```bash
# Web_ClaudeCode_Bridge/.env

PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3030
```

**.gitignore에 추가** (보안!)
```
.env
node_modules/
```

### 4.2 패키지 설치

```bash
cd Web_ClaudeCode_Bridge
npm install dotenv axios
```

### 4.3 Backend 코드 작성

**perplexity_service.js** 생성:

```javascript
// perplexity_service.js - Perplexity API 연동 서비스

require('dotenv').config();
const axios = require('axios');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Perplexity API에 질문을 보내고 답변을 받습니다
 * @param {string} question - 사용자 질문
 * @param {string} model - 사용할 모델 (기본: llama-3.1-sonar-small-128k-online)
 * @returns {Promise<object>} API 응답
 */
async function askPerplexity(question, model = 'llama-3.1-sonar-small-128k-online') {
    try {
        const response = await axios.post(
            PERPLEXITY_API_URL,
            {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: '당신은 친절하고 정확한 AI 어시스턴트입니다. 한국어로 답변해주세요.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            answer: response.data.choices[0].message.content,
            model: response.data.model,
            usage: response.data.usage
        };

    } catch (error) {
        console.error('❌ Perplexity API 오류:', error.response?.data || error.message);

        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

module.exports = { askPerplexity };
```

### 4.4 Express 서버에 엔드포인트 추가

**inbox_server.js에 추가**:

```javascript
const { askPerplexity } = require('./perplexity_service');

// Perplexity API 엔드포인트
app.post('/perplexity/ask', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: '질문이 비어있습니다.'
            });
        }

        console.log(`🔮 Perplexity 질문: ${question}`);

        const result = await askPerplexity(question);

        if (result.success) {
            console.log(`✅ Perplexity 응답 완료`);
            res.json(result);
        } else {
            res.status(500).json(result);
        }

    } catch (error) {
        console.error('❌ Perplexity 요청 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### 4.5 Frontend 코드 작성

**dashboard-mockup.html에 추가**:

```javascript
// Perplexity에 질문 보내기
async function askPerplexity() {
    const question = document.getElementById('perplexityQuestion').value;

    if (!question.trim()) {
        alert('질문을 입력하세요!');
        return;
    }

    // 로딩 표시
    const workspaceEditor = document.getElementById('textEditor');
    workspaceEditor.value = '🔮 Perplexity가 생각 중입니다...\n\n';

    try {
        const response = await fetch('http://localhost:3030/perplexity/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        const result = await response.json();

        if (result.success) {
            // Workspace에 답변 표시
            workspaceEditor.value = `📝 질문: ${question}\n\n`;
            workspaceEditor.value += `🔮 Perplexity의 답변:\n\n`;
            workspaceEditor.value += result.answer;
            workspaceEditor.value += `\n\n---\n`;
            workspaceEditor.value += `모델: ${result.model}\n`;
            workspaceEditor.value += `토큰 사용: ${result.usage.total_tokens}`;

            // 질문창 초기화
            document.getElementById('perplexityQuestion').value = '';
        } else {
            alert(`❌ 오류: ${result.error}`);
            workspaceEditor.value = '';
        }

    } catch (error) {
        console.error('Perplexity 요청 실패:', error);
        alert('Perplexity API 연결 실패!');
        workspaceEditor.value = '';
    }
}
```

**HTML에 ID 추가**:

```html
<textarea id="perplexityQuestion" placeholder="질문을 입력하세요..."></textarea>
<button onclick="askPerplexity()">전송</button>
```

---

## 5. 보안 고려사항

### 5.1 API 키 보호

✅ **DO (해야 할 것)**
- `.env` 파일에 API 키 저장
- `.gitignore`에 `.env` 추가
- Backend 서버에서만 API 키 사용
- 환경 변수로 관리

❌ **DON'T (하지 말아야 할 것)**
- HTML/JavaScript에 API 키 하드코딩
- GitHub에 API 키 업로드
- 클라이언트 사이드에서 직접 API 호출

### 5.2 CORS 설정

```javascript
const cors = require('cors');

// 특정 도메인만 허용 (프로덕션)
app.use(cors({
    origin: 'https://ssalworks.com',
    credentials: true
}));

// 개발 환경에서는 모든 도메인 허용
app.use(cors());
```

### 5.3 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const perplexityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 20, // 최대 20번 요청
    message: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.'
});

app.post('/perplexity/ask', perplexityLimiter, async (req, res) => {
    // ...
});
```

---

## 6. 테스트 방법

### 6.1 API 키 테스트 (curl)

```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer pplx-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-sonar-small-128k-online",
    "messages": [
      {
        "role": "user",
        "content": "안녕하세요! Perplexity API 테스트입니다."
      }
    ]
  }'
```

### 6.2 Backend 테스트

**테스트 스크립트 작성** (test_perplexity.js):

```javascript
require('dotenv').config();
const { askPerplexity } = require('./perplexity_service');

async function test() {
    console.log('🔮 Perplexity API 테스트 시작...\n');

    const result = await askPerplexity('JavaScript에서 async/await란 무엇인가요?');

    if (result.success) {
        console.log('✅ 테스트 성공!\n');
        console.log('📝 답변:');
        console.log(result.answer);
        console.log('\n📊 사용량:');
        console.log(JSON.stringify(result.usage, null, 2));
    } else {
        console.log('❌ 테스트 실패!');
        console.log('오류:', result.error);
    }
}

test();
```

**실행:**
```bash
node test_perplexity.js
```

### 6.3 Frontend 테스트

1. 서버 실행: `node inbox_server.js`
2. Dashboard 열기: `dashboard-mockup.html`
3. Perplexity 섹션에서 질문 입력
4. "전송" 버튼 클릭
5. Workspace에서 답변 확인

---

## 7. 문제 해결

### 7.1 401 Unauthorized

**원인:** API 키가 잘못되었거나 만료됨

**해결:**
1. `.env` 파일의 API 키 확인
2. Perplexity 대시보드에서 새 API 키 생성
3. 서버 재시작

```bash
# .env 파일 확인
cat .env

# 서버 재시작
Ctrl+C
node inbox_server.js
```

### 7.2 429 Too Many Requests

**원인:** API 요청 한도 초과

**해결:**
1. 요금제 확인 (Free: 5,000 크레딧/월)
2. Rate limiting 적용
3. 요청 간 간격 조절

### 7.3 CORS 오류

**원인:** 브라우저에서 서버로 직접 요청 시 CORS 차단

**해결:**
```javascript
// inbox_server.js에 CORS 미들웨어 추가
const cors = require('cors');
app.use(cors());
```

### 7.4 응답 시간 초과

**원인:** 복잡한 질문 또는 네트워크 지연

**해결:**
```javascript
// axios timeout 설정
const response = await axios.post(
    PERPLEXITY_API_URL,
    { /* ... */ },
    {
        headers: { /* ... */ },
        timeout: 30000 // 30초
    }
);
```

---

## 8. 추가 기능 아이디어

### 8.1 대화 히스토리 유지

```javascript
let conversationHistory = [];

function addToHistory(role, content) {
    conversationHistory.push({ role, content });
}

async function askWithHistory(question) {
    addToHistory('user', question);

    const result = await askPerplexity(question, conversationHistory);

    if (result.success) {
        addToHistory('assistant', result.answer);
    }

    return result;
}
```

### 8.2 스트리밍 응답

```javascript
// 실시간으로 답변 표시 (타이핑 효과)
async function askPerplexityStreaming(question) {
    const response = await axios.post(
        PERPLEXITY_API_URL,
        {
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: question }],
            stream: true
        },
        {
            headers: { /* ... */ },
            responseType: 'stream'
        }
    );

    response.data.on('data', (chunk) => {
        // 청크 단위로 답변 표시
        console.log(chunk.toString());
    });
}
```

### 8.3 크레딧 사용량 표시

```javascript
// 사용량 추적
let totalTokensUsed = 0;

function updateCredits(usage) {
    totalTokensUsed += usage.total_tokens;
    document.getElementById('creditDisplay').textContent =
        `사용 토큰: ${totalTokensUsed}`;
}
```

---

## 9. 참고 자료

- **공식 문서**: https://docs.perplexity.ai/
- **API 레퍼런스**: https://docs.perplexity.ai/reference/post_chat_completions
- **요금제**: https://www.perplexity.ai/settings/api
- **지원**: support@perplexity.ai

---

## 10. 체크리스트

테스트 전 확인사항:

- [ ] Perplexity 계정 생성 완료
- [ ] API 키 발급 완료
- [ ] `.env` 파일에 API 키 저장
- [ ] `.gitignore`에 `.env` 추가
- [ ] `npm install dotenv axios` 실행
- [ ] `perplexity_service.js` 작성
- [ ] `inbox_server.js`에 엔드포인트 추가
- [ ] Frontend에 JavaScript 함수 추가
- [ ] 서버 실행 (`node inbox_server.js`)
- [ ] Dashboard에서 테스트 질문 전송

---

**🎉 준비 완료!**

내일 이 가이드를 따라 Perplexity API를 연결하고 테스트해보세요!
