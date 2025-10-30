# Development Plan

**Date**: 2025-10-30
**Project**: PoliticianFinder
**Purpose**: Complete development task execution plan and structure

---

## 📁 Files

### 1. **PoliticianFinder_개발업무_최종.md** (30KB)
- Main project development tasks: 144 items
- Structure: 7 Phases, 6 Areas
- Phase breakdown:
  - Phase 1: Authentication System (20 tasks)
  - Phase 2: Politician System (24 tasks)
  - Phase 3: Community System (32 tasks)
  - Phase 4: Grade/Point System (14 tasks)
  - Phase 5: Payment/Verification (12 tasks)
  - Phase 6: Admin/Additional Features (24 tasks)
  - Phase 7: Deployment & Optimization (18 tasks)

### 2. **PoliticianFinder_업무구조_다이어그램.md** (15KB)
- Task structure visualization (10 diagrams)
- Includes: Phase flow, Area architecture, dependencies, distribution charts

### 3. **AI평가엔진_개발업무.md** (12KB)
- AI Evaluation Engine development tasks: 23 items (6 phases)
- Independent system, API integration with main project in Phase 2

---

## 🎯 Terminology Standards

### Phase (단계)
✅ "1단계(Phase 1)", "2단계(Phase 2)", ... (Korean-English combined)

### Area (영역)
✅ 6 Development Areas (Security integrated into each area):
- DevOps 영역(DevOps Area)
- Database 영역(Database Area)
- Backend Infrastructure 영역(Backend Infrastructure Area)
- Backend APIs 영역(Backend APIs Area)
- Frontend 영역(Frontend Area)
- Test 영역(Test Area)

---

## 📊 Development Areas

```
6 Development Areas

1. DevOps Area
   Project initialization, CI/CD, deployment, schedulers

2. Database Area
   Schema, migrations, triggers, types, RLS policies

3. Backend Infrastructure Area
   Clients, middleware, base configuration
   (Foundation used by all APIs)

4. Backend APIs Area
   Business logic, REST API endpoints

5. Frontend Area
   UI, UX, pages, components

6. Test Area
   E2E tests, API tests, load tests
```

**Note**: Security is not a separate area - always integrated into each area above.

---

## 🔄 Development Order

```
DevOps Area → Database Area → Backend Infrastructure Area
  → Backend APIs Area → Frontend Area → Test Area
```

Parallel processing possible for independent tasks within each area.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Chart.js, Tiptap/Quill
- **Backend**: Next.js API Routes, Supabase, Puppeteer
- **Database**: Supabase (PostgreSQL), Redis (Upstash)
- **AI**: AI Evaluation Engine API (separate)
- **Deployment**: Vercel, Supabase Cloud
- **Monitoring**: Sentry, Vercel Analytics

---

## 📈 Progress Tracking

**1 file = 1 task** | File created = 100% complete

Example:
```
✅ app/signup/page.tsx (Signup page)
✅ app/login/page.tsx (Login page)
🔄 app/politicians/page.tsx (Politician list)
⏳ app/community/page.tsx (Community)
```

---

## 🎯 Why Split Backend into 2 Areas?

**Backend Infrastructure Area**
- Foundation used by all other APIs
- Examples: `lib/supabase/client.ts`, `middleware.ts`

**Backend APIs Area**
- Actual business features
- Examples: `app/api/auth/signup/route.ts`, `app/api/politicians/route.ts`

**Dependency**: Infrastructure complete → APIs can be developed

---

**Last updated**: 2025-10-30
**Total tasks**: 167 (144 Main + 23 AI Engine)
