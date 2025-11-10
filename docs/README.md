# PoliticianFinder - Project Grid Viewer

실시간 프로젝트 진행 상황을 확인할 수 있는 프로젝트 그리드 뷰어입니다.

## 🔗 Live Demo

GitHub Pages: [Project Grid Viewer](https://sunwoongkyu.github.io/PoliticianFinder/)

## 📊 Features

- **실시간 데이터**: Supabase와 연동하여 실시간 작업 진행 상황 확인
- **44개 작업**: 전체 프로젝트 그리드 (Phase 1-7)
- **진행률 추적**: Phase별, 영역별(Frontend, Backend, DevOps, 통합) 진행률
- **상세 정보**: 각 작업의 담당자, 생성 파일, 테스트 결과, 빌드 상태

## 🛠️ Technology Stack

- Pure HTML/CSS/JavaScript
- Supabase Real-time Database
- Responsive Design

## 📝 Data Source

데이터는 Supabase `project_grid_tasks_revised` 테이블에서 가져옵니다.
- 테이블: `project_grid_tasks_revised`
- 총 작업 수: 44개
- Phase: 1-7

---

**Last Updated**: 2025-11-10
**Maintained by**: Claude Code (Sonnet 4.5)
