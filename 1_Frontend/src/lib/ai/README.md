# AI Evaluation System (P4BA14)

## Overview

This module provides AI-powered politician evaluation using 5 different AI models:
- OpenAI GPT-4 (ChatGPT)
- Anthropic Claude Sonnet 4.5
- Google Gemini 1.5 Pro
- xAI Grok
- Perplexity

## Architecture

```
src/lib/ai/
├── types.ts                      # TypeScript type definitions
├── evaluation-engine.ts          # Main orchestration engine
├── prompts/
│   └── evaluation-prompt.ts     # Prompt templates and validation
├── clients/
│   ├── openai-client.ts         # OpenAI (ChatGPT) client
│   ├── anthropic-client.ts      # Anthropic (Claude) client
│   ├── google-client.ts         # Google (Gemini) client
│   ├── xai-client.ts            # xAI (Grok) client
│   └── perplexity-client.ts     # Perplexity client
└── index.ts                     # Main exports
```

## Evaluation Criteria (10 Items)

Each politician is evaluated on 10 criteria (0-100 scale):

1. **Integrity (청렴성)**: Anti-corruption, ethical conduct
2. **Expertise (전문성)**: Policy knowledge, professional background
3. **Communication (소통능력)**: Public engagement, responsiveness
4. **Leadership (리더십)**: Decision-making, vision
5. **Transparency (투명성)**: Disclosure, accountability
6. **Responsiveness (대응성)**: Constituent service, accessibility
7. **Innovation (혁신성)**: New ideas, creative solutions
8. **Collaboration (협력성)**: Cross-party cooperation
9. **Constituency Service (지역봉사)**: Local engagement
10. **Policy Impact (정책영향력)**: Legislative achievements

## Setup

### 1. Install Dependencies

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. Configure Environment Variables

Create `.env.local` file with your API keys:

```bash
# Use 'mock' for development/testing
OPENAI_API_KEY=mock
ANTHROPIC_API_KEY=mock
GOOGLE_AI_API_KEY=mock
XAI_API_KEY=mock
PERPLEXITY_API_KEY=mock

# For production, replace with actual API keys
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# etc.
```

### 3. API Keys (Production)

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google AI**: https://makersuite.google.com/app/apikey
- **xAI**: https://x.ai/api
- **Perplexity**: https://www.perplexity.ai/settings/api

## Usage

### API Endpoint

```typescript
POST /api/evaluations/generate-ai

// Request
{
  "politician_id": "uuid-string"
}

// Response
{
  "success": true,
  "politician": {
    "id": "uuid-string",
    "name": "정치인 이름"
  },
  "results": [
    {
      "model": "chatgpt",
      "saved": true
    },
    // ... 4 more models
  ],
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0,
    "duration_ms": 45000
  }
}
```

### Programmatic Usage

```typescript
import { EvaluationEngine } from '@/lib/ai';

// Initialize engine
const engine = new EvaluationEngine();

// Generate and save all evaluations
const result = await engine.generateAndSaveAll(politicianId);

// Or generate for specific models
const evaluations = await engine.generateAllEvaluations(politicianId);
```

## Features

### 1. Parallel Processing
- All 5 AI models are called in parallel for efficiency
- Typical execution time: 30-60 seconds

### 2. Retry Logic
- Automatic retry on failure (max 3 attempts)
- Exponential backoff delay
- Timeout protection (60 seconds per call)

### 3. Mock Data Fallback
- If API keys are not configured, uses mock data
- Useful for development and testing
- Each model generates different mock scores

### 4. Error Handling
- Graceful degradation (partial success)
- Detailed error logging
- Database transaction safety

### 5. Validation
- Response structure validation
- Score range validation (0-100)
- Evidence length validation (3,000+ chars)

## Database Schema

Evaluations are stored in `ai_evaluations` table:

```sql
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY,
  politician_id UUID REFERENCES politicians(id),
  evaluation_date DATE,
  overall_score INTEGER,
  overall_grade TEXT,
  detailed_analysis JSONB,  -- Contains 10 criteria scores + evidence
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  sources TEXT[],
  ai_model_version TEXT,    -- e.g., "chatgpt-gpt-4-turbo-2024-11-09"
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Cost Optimization

### 1. Caching Strategy
- Results cached by date and model version
- Upsert logic prevents duplicates
- Only regenerate if data has changed

### 2. Incremental Updates
- Check for existing evaluations
- Only update if politician data changed
- Avoid unnecessary API calls

### 3. Rate Limiting
- Respect API provider rate limits
- Implement request throttling if needed
- Monitor API usage and costs

## Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Test API endpoint
curl -X POST http://localhost:3000/api/evaluations/generate-ai \
  -H "Content-Type: application/json" \
  -d '{"politician_id": "uuid-here"}'
```

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement per-user rate limiting
   - Prevent abuse of expensive API calls

3. **Authorization**
   - Require authentication
   - Admin-only access recommended
   - Log all evaluation requests

4. **Input Validation**
   - Validate politician_id format
   - Sanitize user inputs
   - Prevent injection attacks

## Monitoring

### Key Metrics
- API call success rate per model
- Average response time
- Token usage and costs
- Error rates by type

### Logging
All operations are logged with:
- Timestamp
- Model name
- Success/failure status
- Error messages
- Execution duration

## Troubleshooting

### Common Issues

1. **"Empty response from AI"**
   - Check API key validity
   - Verify network connectivity
   - Check API provider status

2. **"Invalid evaluation response structure"**
   - AI model returned malformed JSON
   - Will retry automatically
   - Falls back to mock data after max retries

3. **"Timeout"**
   - Increase timeout value in config
   - Check network latency
   - API provider may be slow

4. **Database save errors**
   - Check Supabase connection
   - Verify table schema
   - Check RLS policies

## Future Enhancements

- [ ] Async job queue (Bull, BullMQ)
- [ ] Webhook notifications
- [ ] Incremental evaluation (only changed criteria)
- [ ] Historical comparison
- [ ] Batch processing for multiple politicians
- [ ] Custom evaluation criteria
- [ ] Multi-language support

## Related Tasks

- **P3BA11**: AI evaluation retrieval API
- **P3BA12**: AI evaluation storage API (mock data)
- **P4BA14**: This task (real AI integration)

## Contact

For questions or issues, refer to PROJECT_GRID documentation.
