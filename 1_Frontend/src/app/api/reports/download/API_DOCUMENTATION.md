# Report Download API Documentation

## Endpoint

```
GET /api/reports/download/[evaluationId]
```

## Description

Download PDF report for an AI evaluation with payment verification and download limit enforcement.

## Authentication

**Required**: Yes

User must be authenticated via Supabase Auth (JWT token in cookie/header).

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| evaluationId | UUID | Yes | AI evaluation ID |

### Query Parameters

None

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | No* | Bearer token (if not using cookie auth) |
| Cookie | No* | Session cookie from Supabase Auth |

*One of Authorization or Cookie is required for authentication

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "download_url": "https://xxx.supabase.co/storage/v1/object/sign/reports/...",
  "filename": "정치인이름_claude_평가리포트_2025-11-09.pdf",
  "expires_in": 3600,
  "downloads": {
    "count": 1,
    "remaining": 9,
    "max": 10
  },
  "report": {
    "evaluation_id": "550e8400-e29b-41d4-a716-446655440000",
    "politician_id": "660e8400-e29b-41d4-a716-446655440000",
    "evaluator": "claude",
    "evaluation_date": "2025-11-09"
  }
}
```

### Error Responses

#### 401 Unauthorized

User is not authenticated.

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "로그인이 필요합니다"
}
```

#### 403 Forbidden

User has not paid for the report.

```json
{
  "success": false,
  "error": "Payment required",
  "message": "리포트를 구매한 사용자만 다운로드 가능합니다"
}
```

#### 404 Not Found

Report or file does not exist.

```json
{
  "success": false,
  "error": "Report not found",
  "message": "리포트를 찾을 수 없습니다"
}
```

OR

```json
{
  "success": false,
  "error": "Report not generated",
  "message": "리포트가 아직 생성되지 않았습니다"
}
```

OR

```json
{
  "success": false,
  "error": "Report file not found",
  "message": "리포트 파일이 스토리지에 존재하지 않습니다"
}
```

#### 429 Too Many Requests

Download limit exceeded (max 10 downloads per purchase).

```json
{
  "success": false,
  "error": "Download limit exceeded",
  "message": "다운로드 횟수 초과 (최대 10회). 이미 10회 다운로드하셨습니다.",
  "details": {
    "total_downloads": 10,
    "max_downloads": 10,
    "remaining": 0
  }
}
```

#### 500 Internal Server Error

Server error occurred.

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "다운로드 처리 중 오류가 발생했습니다",
  "details": "Error message..."
}
```

## Security Features

### 1. Authentication
- User must be logged in
- Session validated via Supabase Auth

### 2. Payment Verification
- Checks if user has completed payment
- Verifies payment covers the specific politician
- Checks if user purchased "all" evaluators or the specific evaluator

### 3. Download Limit
- Maximum 10 downloads per purchase
- Tracked in `download_history` table
- Prevents abuse

### 4. Signed URLs
- Temporary URLs with 1-hour expiration
- Cannot be shared or reused after expiration
- Force download (not browser preview)

### 5. Download Tracking
- Records IP address and user agent
- Audit trail for compliance
- Enables abuse detection

## Payment Verification Logic

The API verifies payment in the following order:

1. **Fetch Evaluation**: Get politician_id and evaluator from evaluation
2. **Query Payments**: Get user's completed payments
3. **Check Each Payment**:
   - Does `metadata.politician_id` match evaluation's politician?
   - Is `metadata.purchased_all` true? → **VERIFIED** ✅
   - Does `metadata.evaluators` include evaluation's evaluator? → **VERIFIED** ✅
4. **No Match**: Payment not verified → **403 Forbidden**

### Payment Metadata Structure

```json
{
  "politician_id": "uuid",
  "politician_name": "정치인 이름",
  "evaluators": ["claude", "chatgpt"],
  "purchased_all": false
}
```

OR (for "all" purchase)

```json
{
  "politician_id": "uuid",
  "politician_name": "정치인 이름",
  "evaluators": ["all"],
  "purchased_all": true
}
```

## Download Limit Enforcement

- **Maximum**: 10 downloads per purchase
- **Tracking**: `download_history` table
- **Count Query**:
  ```sql
  SELECT COUNT(*) FROM download_history
  WHERE user_id = ? AND evaluation_id = ?
  ```
- **Limit Check**: count >= 10 → 429 error

## Example Usage

### cURL

```bash
# Get download URL
curl -X GET "http://localhost:3000/api/reports/download/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Then download the file using the signed URL
curl -O "SIGNED_URL_FROM_RESPONSE"
```

### JavaScript (Fetch)

```javascript
async function downloadReport(evaluationId) {
  try {
    const response = await fetch(`/api/reports/download/${evaluationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();

    // Download using the signed URL
    window.location.href = data.download_url;

    // Or use fetch to download
    const pdfResponse = await fetch(data.download_url);
    const blob = await pdfResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename;
    a.click();

    console.log(`Downloads remaining: ${data.downloads.remaining}`);
  } catch (error) {
    console.error('Download failed:', error.message);
  }
}
```

### React Component

```typescript
import { useState } from 'react';

export function DownloadReportButton({ evaluationId }: { evaluationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState({ count: 0, remaining: 10 });

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/download/${evaluationId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();

      // Update download count
      setDownloads(data.downloads);

      // Download the file
      window.location.href = data.download_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading || downloads.remaining === 0}
      >
        {loading ? 'Downloading...' : 'Download Report'}
      </button>
      <p>Downloads remaining: {downloads.remaining} / {downloads.max}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## Database Schema

### download_history Table

```sql
CREATE TABLE download_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  evaluation_id UUID REFERENCES ai_evaluations(id),
  payment_id UUID REFERENCES payments(id),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Related APIs

- `POST /api/reports/generate` - Generate PDF report
- `POST /api/payments/checkout` - Create payment order
- `POST /api/payments/confirm` - Confirm payment

## Rate Limiting

No rate limiting implemented at API level. Download limit is enforced per purchase (10 downloads).

## Changelog

### 2025-11-09 (P4BA16)
- Initial implementation
- Payment verification
- Download limit enforcement (10 downloads)
- Signed URL generation with 1-hour expiration
- Download history tracking
