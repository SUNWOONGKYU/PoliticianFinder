# PDF Report Generation

Task ID: P4BA15

## Overview

This module provides PDF report generation functionality for AI evaluation reports using Puppeteer.

## Features

- Generate professional PDF reports from AI evaluations
- 30,000+ character comprehensive evaluations
- Korean language support with Noto Sans KR font
- Beautiful, multi-page layout with:
  - Cover page with grade and score
  - Summary and overview
  - 10 detailed evaluation criteria
  - Historical trend chart
- Upload to Supabase Storage
- Caching to prevent duplicate generation

## Files

- `types.ts` - TypeScript type definitions
- `html-generator.ts` - HTML template generation (without React rendering)
- `report-generator.ts` - Puppeteer PDF generation engine
- `templates/evaluation-report.tsx` - React template component (for reference)
- `index.ts` - Module exports

## Usage

### Generate PDF Report

```typescript
import { getReportGenerator } from '@/lib/pdf/report-generator';
import { uploadReportPDF } from '@/lib/storage/upload';

// Get generator instance
const generator = getReportGenerator();

// Generate PDF
const pdfBuffer = await generator.generatePDF(
  politician,
  evaluation,
  history
);

// Upload to Supabase Storage
const reportUrl = await uploadReportPDF(
  politicianId,
  evaluationId,
  pdfBuffer
);
```

### API Endpoint

```bash
# Generate new PDF report
POST /api/reports/generate
{
  "politician_id": "uuid",
  "evaluation_id": "uuid",
  "force_regenerate": false  // optional
}

# Check if report exists
GET /api/reports/generate?politician_id=uuid&evaluation_id=uuid
```

## Database Requirements

The `ai_evaluations` table requires a `report_url` column:

```sql
ALTER TABLE ai_evaluations
ADD COLUMN IF NOT EXISTS report_url TEXT;
```

Run the migration file: `migrations/add_report_url_to_ai_evaluations.sql`

## Supabase Storage

A public `reports` bucket must be created in Supabase Storage:

```typescript
import { ensureReportsBucketExists } from '@/lib/storage/upload';

// Create bucket if it doesn't exist
await ensureReportsBucketExists();
```

Or create manually via Supabase Dashboard:
- Bucket name: `reports`
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: `application/pdf`

## Performance Considerations

- **Generation time**: 10-30 seconds per report
- **Memory usage**: 200-500MB (Puppeteer)
- **File size**: 5-10MB per PDF
- **Caching**: 7 days (via Cache-Control header)
- **Concurrent limit**: Recommended max 5 simultaneous generations

### Production Recommendations

1. **Use background jobs** for PDF generation (BullMQ, Inngest)
2. **Separate service** for Puppeteer in serverless environments
3. **Cache aggressively** to prevent duplicate generation
4. **Monitor memory usage** and adjust serverless limits

## Validation

The report generator validates:
- Each criterion has at least 1,000 characters of evidence
- Total character count across all criteria
- Minimum recommended: 30,000 characters

```typescript
const isValid = generator.validateEvaluationData(evaluation);
const charCount = generator.calculateTotalCharacters(evaluation);
```

## Error Handling

All errors are caught and logged with appropriate HTTP status codes:
- 400: Bad request (missing parameters)
- 401: Unauthorized
- 404: Politician or evaluation not found
- 500: PDF generation failed

## Security

- Server-only module (marked with `import 'server-only'`)
- Authentication required for all API calls
- Public URLs are signed by Supabase Storage
- Row-level security (RLS) on database queries

## Example Response

```json
{
  "success": true,
  "report_url": "https://[project].supabase.co/storage/v1/object/public/reports/[politician_id]/[evaluation_id].pdf",
  "cached": false,
  "generation_time_ms": 15234,
  "character_count": 32450,
  "file_size_bytes": 8456123,
  "politician": {
    "id": "uuid",
    "name": "홍길동"
  },
  "evaluation": {
    "id": "uuid",
    "evaluation_date": "2025-11-09",
    "overall_score": 85,
    "overall_grade": "A"
  }
}
```

## Dependencies

- `puppeteer`: ^24.29.1
- `server-only`: For Next.js server-only modules
- `@supabase/supabase-js`: For storage operations

## Notes

- Puppeteer downloads Chromium (~170MB) on first install
- In Docker/serverless, use lightweight Chromium or Chrome headless
- Font loading requires network access (Google Fonts CDN)
- For offline use, bundle fonts locally
