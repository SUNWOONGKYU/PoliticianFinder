# PROJECT GRID REVISED - SQL Data Generation

## Generated File

**Output**: `project_grid_revised_63_data.sql`

## Summary

- **Total Tasks**: 67 (not 63 as in filename - CSV contains 67 tasks)
- **Total INSERT Statements**: 67
- **Total Lines**: 1,168
- **Generated**: 2025-11-06
- **Target Table**: `project_grid_tasks_revised`

## Task Distribution by Phase

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Frontend + Mock API | 27 |
| Phase 2 | Database Schema | 1 |
| Phase 3 | Real API Implementation | 23 |
| Phase 4 | Backend Utilities & Crawlers | 9 |
| Phase 5 | Testing | 3 |
| Phase 6 | DevOps & Deployment | 4 |
| **Total** | | **67** |

## Table Schema

```sql
CREATE TABLE project_grid_tasks_revised (
    phase INTEGER,
    area VARCHAR(10),
    task_id VARCHAR(20),
    task_name TEXT,
    instruction_file TEXT,
    assigned_agent VARCHAR(100),
    tools TEXT,
    work_mode VARCHAR(50),
    dependency_chain TEXT,
    progress INTEGER,
    status VARCHAR(50),
    generated_files TEXT,
    generator VARCHAR(50),
    duration VARCHAR(50),
    modification_history TEXT,
    test_history TEXT,
    build_result VARCHAR(20),
    dependency_propagation VARCHAR(50),
    blocker TEXT,
    validation_result TEXT,
    remarks TEXT
);
```

## Data Source

**Input Files**:
1. `task_list_revised_63.csv` - Task list with basic information
2. `tasks/P*.md` - 67 task instruction files with detailed specifications

**Extraction Process**:
- `phase`, `area`, `task_id`, `task_name`: Extracted from CSV
- `assigned_agent`: Extracted from task instruction .md files (서브 에이전트)
- `tools`: Extracted from [기술 스택] section in .md files
- `dependency_chain`: Extracted from 의존성 체인 in .md files
- `remarks`: Extracted from 작업 목표 section in .md files

## Default Values for All Tasks

All tasks start with these default values:

```sql
progress = 0
status = '대기'
generated_files = '-'
generator = '-'
duration = '-'
modification_history = '-'
test_history = '대기'
build_result = '⏳ 대기'
dependency_propagation = '⏳ 대기'
blocker = '없음'
validation_result = '⏳ 대기'
work_mode = 'AI-Only'
```

## Sample INSERT Statement

```sql
INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'F', 'P1F1', 'React 전체 페이지 변환',
    'tasks/P1F1.md', 'frontend-developer',
    'TypeScript, React, Next.js, Tailwind CSS', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '프로토타입 28개 + 개선 5개 페이지를 React로 변환'
);
```

## Agent Distribution

| Agent Type | Phase | Count |
|------------|-------|-------|
| frontend-developer | 1 | 1 |
| backend-developer | 1, 3 | 3 |
| api-designer | 1, 3, 4 | 52 |
| database-developer | 2 | 1 |
| test-engineer | 5 | 3 |
| devops-engineer | 4, 6 | 7 |

## Usage

To load this data into Supabase:

1. Create the table using the schema above
2. Execute the SQL file:
   ```bash
   psql -h <host> -U <user> -d <database> -f project_grid_revised_63_data.sql
   ```

Or use Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `project_grid_revised_63_data.sql`
3. Execute

## Notes

- All SQL strings are properly escaped (single quotes doubled)
- Korean characters are preserved with UTF-8 encoding
- File follows PostgreSQL/Supabase SQL syntax
- Each INSERT is a separate statement for easier debugging

## Generation Script

See `C:\Development_PoliticianFinder_copy\generate_sql.py` for the Python script that generated this SQL file.
