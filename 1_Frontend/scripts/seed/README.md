# Politician Data Seeding Script

**Task**: P4BA2 - 정치인 데이터 시딩

## Overview

This script seeds the Supabase database with initial politician data. It supports both crawled data from P4BA1 and sample data for testing.

## Features

- **UPSERT Strategy**: Prevents duplicate entries using `(name, party)` composite key
- **Data Sources**:
  - P4BA1 crawled JSON data
  - Built-in sample data for testing
- **Related Data**: Inserts politicians, careers, and pledges
- **Error Handling**: Robust error handling with detailed logging
- **Statistics**: Provides detailed seeding statistics

## Prerequisites

1. **Environment Variables**: Set up `.env.local` with Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

3. **Database Schema**: Ensure the following tables exist in Supabase:
   - `politicians`
   - `careers`
   - `pledges`

## Usage

### Method 1: Using npm script (Recommended)

```bash
# Using sample data
npm run seed:politicians

# Using crawled JSON data
npm run seed:politicians ./data/crawled-politicians.json
```

### Method 2: Direct execution

```bash
# Using sample data
npx tsx scripts/seed/seed-politicians.ts

# Using crawled JSON data
npx tsx scripts/seed/seed-politicians.ts ./path/to/data.json
```

## Data Format

### Crawled Data Format (from P4BA1)

```json
[
  {
    "name": "홍길동",
    "party": "더불어민주당",
    "district": "서울 강남구",
    "contact": {
      "phone": "02-788-1111",
      "email": "hong@assembly.go.kr",
      "office": "서울특별시 영등포구 의사당대로 1"
    },
    "career": [
      {
        "period": "2020-현재",
        "description": "제21대 국회의원"
      }
    ],
    "metadata": {
      "crawledAt": "2025-11-09T10:00:00Z",
      "sourceUrl": "https://...",
      "confidence": 0.95
    }
  }
]
```

### Database Schema

#### politicians table
```typescript
{
  name: string;
  name_en?: string;
  party: string;
  position?: string;
  region?: string;
  district?: string;
  phone?: string;
  email?: string;
  office_address?: string;
  profile_image_url?: string;
  birth_date?: string;
  education?: string[];
  website_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
}
```

#### careers table
```typescript
{
  politician_id: string;  // FK to politicians
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  order_index: number;
}
```

#### pledges table
```typescript
{
  politician_id: string;  // FK to politicians
  title: string;
  description?: string;
  category?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'broken' | 'postponed';
  progress_percentage?: number;
  target_date?: string;
}
```

## UPSERT Strategy

The script uses an UPSERT strategy to handle duplicates:

```typescript
// Check for existing politician by (name, party)
const existing = await supabase
  .from('politicians')
  .select('id')
  .eq('name', politician.name)
  .eq('party', politician.party)
  .maybeSingle();

if (existing) {
  // UPDATE existing record
  await supabase
    .from('politicians')
    .update(politician)
    .eq('id', existing.id);
} else {
  // INSERT new record
  await supabase
    .from('politicians')
    .insert(politician);
}
```

## Output Example

```
🌱 Starting politician data seeding...

📊 Using sample data

[1/3] Processing: 홍길동 (더불어민주당)
  ✅ Inserted politician (ID: 123e4567-e89b-12d3-a456-426614174000)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

[2/3] Processing: 김철수 (국민의힘)
  ♻️  Updated politician (ID: 223e4567-e89b-12d3-a456-426614174001)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

[3/3] Processing: 이영희 (정의당)
  ✅ Inserted politician (ID: 323e4567-e89b-12d3-a456-426614174002)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

============================================================
🎉 Seeding completed!

📊 Statistics:
  - Politicians inserted: 2
  - Politicians updated: 1
  - Politicians failed: 0
  - Careers inserted: 9
  - Pledges inserted: 9
============================================================
```

## Sample Data

The script includes 3 sample politicians with complete data:

1. **홍길동** - 더불어민주당, 서울 강남구
2. **김철수** - 국민의힘, 경기 성남시 분당구
3. **이영희** - 정의당, 부산 해운대구

Each sample politician includes:
- Basic information (name, party, district, contact)
- 3 career entries
- 3 pledges with varying statuses

## Error Handling

The script handles various error scenarios:

- **Missing Environment Variables**: Exits with error message
- **Invalid JSON Format**: Logs error and falls back to sample data
- **Database Errors**: Logs detailed error messages
- **Network Issues**: Handles Supabase connection errors

## Statistics Tracking

The script tracks and reports:

- Politicians inserted (new records)
- Politicians updated (existing records)
- Politicians failed (errors)
- Total careers inserted
- Total pledges inserted
- List of all errors encountered

## Related Tasks

- **P4BA1**: 선관위 크롤링 스크립트 (provides crawl data)
- **P2D1**: Complete Database Schema (database tables)

## Troubleshooting

### Error: Missing Supabase credentials

**Solution**: Ensure `.env.local` exists and contains valid credentials:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Error: Table does not exist

**Solution**: Run database migrations in Supabase:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Execute migration files from `0-4_Database/Supabase/migrations/`

### Error: tsx command not found

**Solution**: Install dependencies:
```bash
npm install
```

### Error: Permission denied

**Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` has necessary permissions:
- Check Supabase Dashboard > Settings > API
- Ensure you're using the service_role key, not anon key

## File Location

**Absolute Path**:
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend\scripts\seed\seed-politicians.ts
```

## Next Steps

After seeding:
1. Verify data in Supabase Dashboard
2. Test politician API endpoints
3. Check data integrity with queries
4. Update with actual crawled data when available

## Security Notes

- **Service Role Key**: Only use in secure server environments
- **Never expose**: Service role key should never be in client-side code
- **Environment Variables**: Keep `.env.local` in `.gitignore`
- **Credentials**: Never commit sensitive credentials to version control
