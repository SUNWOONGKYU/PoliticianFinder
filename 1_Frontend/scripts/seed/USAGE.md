# Quick Start Guide - Politician Data Seeding

**Task**: P4BA2 - 정치인 데이터 시딩

## Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend
npm install
```

### Step 2: Verify Environment Variables

Ensure `.env.local` contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Run Seeding

```bash
# Using built-in sample data (recommended for testing)
npm run seed:politicians

# Using crawled data from P4BA1
npm run seed:politicians ./data/crawled-politicians.json
```

## Expected Output

```
🌱 Starting politician data seeding...

📊 Using sample data

[1/3] Processing: 홍길동 (더불어민주당)
  ✅ Inserted politician (ID: 123e4567-...)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

[2/3] Processing: 김철수 (국민의힘)
  ✅ Inserted politician (ID: 223e4567-...)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

[3/3] Processing: 이영희 (정의당)
  ✅ Inserted politician (ID: 323e4567-...)
  ✅ Inserted 3 careers
  ✅ Inserted 3 pledges

============================================================
🎉 Seeding completed!

📊 Statistics:
  - Politicians inserted: 3
  - Politicians updated: 0
  - Politicians failed: 0
  - Careers inserted: 9
  - Pledges inserted: 9
============================================================
```

## Verify Results

### Option 1: Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Table Editor**
4. Check these tables:
   - `politicians` - Should have 3 rows
   - `careers` - Should have 9 rows
   - `pledges` - Should have 9 rows

### Option 2: SQL Query
```sql
-- Check politicians count
SELECT COUNT(*) FROM politicians;

-- Check careers count
SELECT COUNT(*) FROM careers;

-- Check pledges count
SELECT COUNT(*) FROM pledges;

-- View all politicians
SELECT name, party, district FROM politicians;
```

## Common Issues

### Error: Missing environment variables
**Solution**:
```bash
# Check if .env.local exists
ls .env.local

# If not, copy from template
cp .env.local.example .env.local

# Edit and add your Supabase credentials
```

### Error: tsx command not found
**Solution**:
```bash
npm install
```

### Error: Cannot connect to Supabase
**Solution**:
1. Check your internet connection
2. Verify Supabase URL and keys in `.env.local`
3. Check Supabase project status in dashboard

### Error: Table does not exist
**Solution**:
1. Run database migrations in Supabase
2. Check `0-4_Database/Supabase/migrations/` folder
3. Execute migration SQL files in Supabase SQL Editor

## Advanced Usage

### Custom Data File
```bash
npm run seed:politicians /path/to/your/data.json
```

### Re-run Seeding (Update Mode)
```bash
# Running again will UPDATE existing politicians
# and INSERT new ones
npm run seed:politicians
```

### View Script Help
```bash
npx tsx scripts/seed/seed-politicians.ts --help
```

## Next Steps

After successful seeding:
1. Test politician API endpoints
2. Verify data integrity
3. Update with real crawled data
4. Set up automated seeding jobs

## Documentation

- **Full Documentation**: `scripts/seed/README.md`
- **Implementation Details**: `P4BA2_IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `0-4_Database/Supabase/migrations/DATABASE_SCHEMA.md`

## Support

For issues or questions:
1. Check `scripts/seed/README.md` for detailed documentation
2. Review error messages for specific guidance
3. Verify environment variables and database schema
