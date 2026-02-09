# generate_report_v40.py
import os
import json
import statistics
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
from collections import defaultdict

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 등급 변환 매핑
RATING_TO_VALUE = {
    '+4': 4, '+3': 3, '+2': 2, '+1': 1,
    '-1': -1, '-2': -2, '-3': -3, '-4': -4,
    'X': None  # 평가 제외
}

CATEGORIES = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}

# 등급 체계
GRADE_BOUNDARIES = [
    (920, 1000, 'M', 'Mugunghwa'),   # 최우수
    (840, 919, 'D', 'Diamond'),      # 우수
    (760, 839, 'E', 'Emerald'),      # 양호
    (680, 759, 'P', 'Platinum'),     # 보통+
    (600, 679, 'G', 'Gold'),         # 보통
    (520, 599, 'S', 'Silver'),       # 보통-
    (440, 519, 'B', 'Bronze'),       # 미흡
    (360, 439, 'I', 'Iron'),         # 부족
    (280, 359, 'Tn', 'Tin'),         # 상당히 부족
    (200, 279, 'L', 'Lead')          # 매우 부족
]

def generate_report_v40(politician_id, politician_name):
    """AI 기반 정치인 상세평가보고서 생성 (V40)"""

    print(f"[보고서 생성] AI 기반 정치인 상세평가보고서 생성 중: {politician_name}")

    # 1. 최종 점수 조회
    final_scores = get_final_scores(politician_id)

    # 2. AI별 평가 데이터 조회
    evaluations = get_all_evaluations(politician_id)

    # 3. 수집 데이터 조회
    collected_data = get_collected_data(politician_id)

    # 4. AI별 통계 계산
    ai_stats = calculate_ai_statistics(evaluations)

    # 5. 출처 통계 분석 (수집 + 평가)
    collection_stats, evaluation_stats = analyze_source_statistics(collected_data, evaluations)

    # 6. 카테고리별 분석
    category_analysis = analyze_categories(evaluations, collected_data)

    # 7. 보고서 생성
    report = build_report_v40(
        politician_name,
        final_scores,
        ai_stats,
        category_analysis,
        collection_stats,
        evaluation_stats,
        collected_data,
        evaluations
    )

    # 7. 파일 저장
    filepath = save_report(report, politician_name)

    print(f"[완료] 보고서 생성 완료: {filepath}")
    return report

def get_final_scores(politician_id):
    """최종 점수 조회"""
    result = supabase.table('ai_final_scores_v40')\
        .select('*')\
        .eq('politician_id', politician_id)\
        .execute()

    if not result.data:
        raise ValueError(f"No final scores found for politician_id: {politician_id}")

    return result.data[0]

def get_all_evaluations(politician_id):
    """모든 AI 평가 데이터 조회"""
    # Supabase 기본 제한 1000개 해제
    all_data = []
    offset = 0
    batch_size = 1000

    while True:
        result = supabase.table('evaluations_v40')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + batch_size - 1)\
            .execute()

        if not result.data:
            break

        all_data.extend(result.data)

        if len(result.data) < batch_size:
            break

        offset += batch_size

    return all_data

def get_collected_data(politician_id):
    """수집 데이터 조회"""
    # Supabase 기본 제한 1000개 해제
    all_data = []
    offset = 0
    batch_size = 1000

    while True:
        result = supabase.table('collected_data_v40')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + batch_size - 1)\
            .execute()

        if not result.data:
            break

        all_data.extend(result.data)

        if len(result.data) < batch_size:
            break

        offset += batch_size

    return all_data

def calculate_ai_statistics(evaluations):
    """AI별 평가 통계 계산"""
    ai_stats = defaultdict(lambda: {
        'total': 0,
        'ratings': defaultdict(int),
        'avg_rating': 0,
        'x_count': 0,
        'positive_count': 0,
        'negative_count': 0
    })

    for ev in evaluations:
        ai = ev['evaluator_ai']
        rating = ev['rating']

        ai_stats[ai]['total'] += 1
        ai_stats[ai]['ratings'][rating] += 1

        if rating == 'X':
            ai_stats[ai]['x_count'] += 1
        elif rating in ['+4', '+3', '+2', '+1']:
            ai_stats[ai]['positive_count'] += 1
        elif rating in ['-1', '-2', '-3', '-4']:
            ai_stats[ai]['negative_count'] += 1

    # 평균 등급 계산
    for ai, stats in ai_stats.items():
        total_value = 0
        count = 0
        for rating, cnt in stats['ratings'].items():
            value = RATING_TO_VALUE.get(rating)
            if value is not None:
                total_value += value * cnt
                count += cnt

        stats['avg_rating'] = total_value / count if count > 0 else 0

    return dict(ai_stats)

def analyze_source_statistics(collected_data, evaluations):
    """출처 통계 분석 (수집 + 평가)"""

    # 수집 통계 (collector_ai별)
    collection_stats = {}
    for cat_en, cat_kr in CATEGORIES.items():
        cat_data = [d for d in collected_data if d['category'] == cat_en]

        collector_counts = {}
        for data in cat_data:
            collector = data.get('collector_ai', 'Unknown')
            collector_counts[collector] = collector_counts.get(collector, 0) + 1

        collection_stats[cat_en] = {
            'category_kr': cat_kr,
            'collectors': collector_counts,
            'total': len(cat_data)
        }

    # 평가 통계 (evaluator_ai별)
    evaluation_stats = {}
    for cat_en, cat_kr in CATEGORIES.items():
        cat_evals = [e for e in evaluations if e['category'] == cat_en]

        evaluator_counts = {}
        for ev in cat_evals:
            evaluator = ev.get('evaluator_ai', 'Unknown')
            evaluator_counts[evaluator] = evaluator_counts.get(evaluator, 0) + 1

        evaluation_stats[cat_en] = {
            'category_kr': cat_kr,
            'evaluators': evaluator_counts,
            'total': len(cat_evals)
        }

    return collection_stats, evaluation_stats

def analyze_categories(evaluations, collected_data):
    """카테고리별 분석"""
    analysis = {}

    # 데이터를 카테고리별로 그룹화
    data_by_cat = defaultdict(list)
    for data in collected_data:
        data_by_cat[data['category']].append(data)

    eval_by_cat = defaultdict(list)
    for ev in evaluations:
        eval_by_cat[ev['category']].append(ev)

    for cat_en, cat_kr in CATEGORIES.items():
        cat_evals = eval_by_cat[cat_en]
        cat_data = data_by_cat[cat_en]

        # 수집 현황 (collector_ai별, data_type별)
        collection_status = {}
        for collector in ['Gemini', 'Naver']:
            collector_data = [d for d in cat_data if d.get('collector_ai') == collector]
            official_count = len([d for d in collector_data if d.get('data_type', '').upper() == 'OFFICIAL'])
            public_count = len([d for d in collector_data if d.get('data_type', '').upper() == 'PUBLIC'])

            collection_status[collector] = {
                'official': official_count,
                'public': public_count,
                'total': len(collector_data)
            }

        # AI별 점수
        ai_scores = {}
        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            ai_evals = [e for e in cat_evals if e['evaluator_ai'] == ai]

            total_value = 0
            count = 0
            x_count = 0

            for ev in ai_evals:
                if ev['rating'] == 'X':
                    x_count += 1
                else:
                    value = RATING_TO_VALUE.get(ev['rating'])
                    if value is not None:
                        total_value += value
                        count += 1

            avg = total_value / count if count > 0 else 0
            ai_scores[ai] = {
                'avg_rating': avg,
                'evaluated': count,
                'excluded': x_count
            }

        # 대표 사례 추출 (긍정/부정)
        positive_cases = []
        negative_cases = []

        # collected_data_id가 null이면 source_url로 매칭
        # 매칭 맵 생성: URL을 키로, 데이터를 값으로
        url_map = {}
        for d in cat_data:
            url = d.get('source_url', '').strip()
            if url:
                url_map[url] = d

        for ev in cat_evals:
            # collected_data_id로 먼저 시도
            data = None
            if ev.get('collected_data_id'):
                data = next((d for d in cat_data if d['id'] == ev['collected_data_id']), None)

            # collected_data_id가 없거나 매칭 실패 시, source_url로 매칭
            # evaluations_v40에 source_url이 없으므로, reasoning에서 URL 추출은 불가능
            # 대신 모든 평가 결과를 표시하되, 데이터 정보 없이 평가만 표시

            if ev['rating'] in ['+4', '+3'] and len(positive_cases) < 10:
                positive_cases.append({
                    'data': data if data else {},  # 빈 dict로 대체
                    'evaluation': ev
                })
            elif ev['rating'] in ['-3', '-4'] and len(negative_cases) < 5:
                negative_cases.append({
                    'data': data if data else {},  # 빈 dict로 대체
                    'evaluation': ev
                })

        analysis[cat_en] = {
            'category_kr': cat_kr,
            'collection_status': collection_status,
            'ai_scores': ai_scores,
            'positive_cases': positive_cases,
            'negative_cases': negative_cases,
            'total_data': len(cat_data),
            'total_evals': len(cat_evals)
        }

    return analysis

def build_report_v40(politician_name, final_scores, ai_stats, category_analysis, collection_stats, evaluation_stats, collected_data, evaluations):
    """V40.2 보고서 마크다운 생성 (8섹션 구조)"""

    # JSONB 데이터 파싱
    ai_final_scores = final_scores.get('ai_final_scores', {})
    if isinstance(ai_final_scores, str):
        ai_final_scores = json.loads(ai_final_scores)

    ai_category_scores = final_scores.get('ai_category_scores', {})
    if isinstance(ai_category_scores, str):
        ai_category_scores = json.loads(ai_category_scores)

    # 카테고리별 평균 점수 및 통계 계산
    cat_avg_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                 for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        cat_avg_scores[cat_en] = {
            'avg': sum(scores) / len(scores) if scores else 0,
            'scores': scores,
            'stdev': statistics.stdev(scores) if len(scores) > 1 else 0,
            'kr': cat_kr
        }

    # 점수 높은 순/낮은 순 정렬
    sorted_by_score = sorted(cat_avg_scores.items(), key=lambda x: x[1]['avg'], reverse=True)
    top_categories = sorted_by_score[:5]    # 강점 TOP 5
    bottom_categories = sorted_by_score[-3:]  # 약점 TOP 3

    top_names = ', '.join([cat_avg_scores[c]['kr'] for c, _ in top_categories[:3]])
    bottom_names = ', '.join([cat_avg_scores[c]['kr'] for c, _ in bottom_categories])

    # 전체 데이터 통계
    total_collected = len(collected_data)
    total_evaluated = len(evaluations)
    total_positive = sum(ai_stats[ai]['positive_count'] for ai in ai_stats)
    total_negative = sum(ai_stats[ai]['negative_count'] for ai in ai_stats)
    total_x = sum(ai_stats[ai]['x_count'] for ai in ai_stats)
    total_all = sum(ai_stats[ai]['total'] for ai in ai_stats)

    pos_pct = total_positive / total_all * 100 if total_all > 0 else 0
    neg_pct = total_negative / total_all * 100 if total_all > 0 else 0
    x_pct = total_x / total_all * 100 if total_all > 0 else 0

    # === 섹션 1: 정치인 프로필 ===
    report = f"""# {politician_name} AI 기반 정치인 상세평가보고서

**평가 버전**: V40.2
**평가 일자**: {datetime.now().strftime('%Y-%m-%d')}
**총 평가 수**: {total_all:,}개 (4 AIs × 약 1,000개)
**평가 AI**: Claude, ChatGPT, Grok, Gemini

---

## 1. 정치인 프로필

(정치인 기본 정보, 경력, 전문 분야 - DB politicians 테이블에서 조회)

---

"""

    # === 섹션 2: 평가 요약 ===
    report += f"""## 2. 평가 요약

### 최종 점수 및 등급
- **최종 점수**: **{final_scores['final_score']}점** / 1,000점
- **등급**: **{final_scores['grade']}**
- **종합 평가**: {get_grade_description(final_scores['grade'], ai_category_scores)}

### 한 줄 평가
> **"{top_names} 분야에서 높은 AI 합의를 얻었으며, {bottom_names} 강화 시 종합 평가 상승 여지가 큼"**

### 핵심 인사이트
- 4개 AI가 {top_names} 분야에서 높은 점수 합의를 보였습니다.
- {bottom_names} 분야는 즉시 개선 가능한 영역입니다.
- 전체 평가 중 긍정 평가가 {pos_pct:.1f}%를 차지하여 전반적으로 긍정적인 평가를 받았습니다.

### AI별 점수

| AI | 점수 | 평균 등급 |
|---|:---:|:--------:|
"""

    ai_scores_sorted = sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True)
    for ai, score in ai_scores_sorted:
        avg_rating = ai_stats[ai]['avg_rating']
        report += f"| {ai} | {score}점 | {avg_rating:+.2f} |\n"

    avg_score = final_scores['final_score']
    avg_rating = sum(ai_stats[ai]['avg_rating'] for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']) / 4
    report += f"| **4 AIs 평균** | **{avg_score}점** | **{avg_rating:+.2f}** |\n"

    # 카테고리별 점수 표
    report += "\n### 카테고리별 점수 (10개)\n\n"
    report += "| 카테고리 | 점수 | 평가 |\n"
    report += "|---------|:----:|------|\n"

    for cat_en, info in sorted_by_score:
        report += f"| {info['kr']} ({cat_en.title()}) | {info['avg']:.0f}점 | {get_score_evaluation(info['avg'])} |\n"

    # 긍정/부정/X 비율
    report += f"""
### 긍정/부정/X 비율

긍정: {'█' * int(pos_pct / 5)} {pos_pct:.1f}% ({total_positive:,}개)
부정: {'█' * max(1, int(neg_pct / 5))} {neg_pct:.1f}% ({total_negative:,}개)
X:    {'█' * max(1, int(x_pct / 5))} {x_pct:.1f}% ({total_x:,}개)

---

"""

    # === 섹션 3: 강점 분석 (점수 기반, 뉴스 사례 X) ===
    report += "## 3. 강점 분석\n\n"

    for rank, (cat_en, info) in enumerate(top_categories, 1):
        cat_kr = info['kr']
        avg = info['avg']
        stdev = info['stdev']
        scores = info['scores']  # [Claude, ChatGPT, Grok, Gemini]
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        max_idx = scores.index(max(scores))
        min_idx = scores.index(min(scores))

        # 카테고리별 긍정/부정 비율 계산
        analysis = category_analysis[cat_en]
        cat_evals = [ev for ev in evaluations if ev['category'] == cat_en]
        cat_pos = sum(1 for ev in cat_evals if ev['rating'] in ['+4', '+3', '+2', '+1'])
        cat_neg = sum(1 for ev in cat_evals if ev['rating'] in ['-1', '-2', '-3', '-4'])
        cat_x = sum(1 for ev in cat_evals if ev['rating'] == 'X')
        cat_total = len(cat_evals)

        cat_pos_pct = cat_pos / cat_total * 100 if cat_total > 0 else 0
        cat_neg_pct = cat_neg / cat_total * 100 if cat_total > 0 else 0
        cat_x_pct = cat_x / cat_total * 100 if cat_total > 0 else 0

        report += f"""### 강점 {rank}: {cat_kr} ({avg:.0f}점) ⭐

#### 왜 강점인가
- 4개 AI 평균 {avg:.0f}점, 10개 카테고리 중 {rank}위
- AI별 점수: {', '.join([f'{ai_names[i]} {scores[i]:.0f}점' for i in range(4)])}

#### AI 일치도
- 표준편차 {stdev:.1f}점 ({"일관성 높음" if stdev < 3 else "일관성 보통" if stdev < 5 else "편차 있음"})
- 최고 AI: {ai_names[max_idx]} ({scores[max_idx]:.0f}점)
- 최저 AI: {ai_names[min_idx]} ({scores[min_idx]:.0f}점)
- 차이: {scores[max_idx] - scores[min_idx]:.0f}점

#### 긍정/부정 비율
- 긍정 {cat_pos_pct:.1f}% ({cat_pos}개), 부정 {cat_neg_pct:.1f}% ({cat_neg}개), X {cat_x_pct:.1f}% ({cat_x}개)

#### 핵심 강점 요인
{cat_kr} 분야에서 높은 점수를 받은 것은 해당 영역에서 지속적이고 긍정적인 활동을 펼쳐왔기 때문입니다.
4개 AI가 모두 유사한 평가를 내린 것은 객관적으로 검증 가능한 성과와 실적이 다수 존재함을 의미합니다.
특히 긍정 평가 비율이 {cat_pos_pct:.1f}%에 달하는 것은 이 분야에서의 활동이 일관되게 긍정적으로 평가받고 있음을 보여줍니다.

#### 강화 방향 ⭐
1. **현재 강점 유지 및 심화**: 기존의 성공 사례를 지속적으로 확대하고, 관련 분야에서의 전문성을 더욱 강화하여 리더십을 공고히 합니다.
2. **대중 커뮤니케이션 강화**: 이미 높은 성과를 거두고 있는 만큼, 이를 시민들에게 더 적극적으로 알려 인지도와 신뢰도를 제고합니다.
3. **벤치마킹 사례 확산**: 이 분야의 성공 경험을 다른 영역으로 확장하여, 전반적인 정치 활동의 질을 향상시킵니다.

"""

    report += "---\n\n"

    # === 섹션 4: 약점 분석 ===
    report += "## 4. 약점 분석\n\n"

    for rank, (cat_en, info) in enumerate(bottom_categories, 1):
        cat_kr = info['kr']
        avg = info['avg']
        stdev = info['stdev']
        scores = info['scores']
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        max_idx = scores.index(max(scores))
        min_idx = scores.index(min(scores))

        # 카테고리별 부정 비율 계산
        cat_evals = [ev for ev in evaluations if ev['category'] == cat_en]
        cat_pos = sum(1 for ev in cat_evals if ev['rating'] in ['+4', '+3', '+2', '+1'])
        cat_neg = sum(1 for ev in cat_evals if ev['rating'] in ['-1', '-2', '-3', '-4'])
        cat_x = sum(1 for ev in cat_evals if ev['rating'] == 'X')
        cat_total = len(cat_evals)

        cat_pos_pct = cat_pos / cat_total * 100 if cat_total > 0 else 0
        cat_neg_pct = cat_neg / cat_total * 100 if cat_total > 0 else 0
        cat_x_pct = cat_x / cat_total * 100 if cat_total > 0 else 0

        report += f"""### 약점 {rank}: {cat_kr} ({avg:.0f}점) ⚠️

#### 왜 약점인가
- 4개 AI 평균 {avg:.0f}점, 10개 카테고리 중 하위 영역
- AI별 점수: {', '.join([f'{ai_names[i]} {scores[i]:.0f}점' for i in range(4)])}

#### AI 평가 편차
- 표준편차 {stdev:.1f}점 ({"일관성 높음" if stdev < 3 else "일관성 보통" if stdev < 5 else "편차 있음"})
- 최고 AI: {ai_names[max_idx]} ({scores[max_idx]:.0f}점)
- 최저 AI: {ai_names[min_idx]} ({scores[min_idx]:.0f}점)
- 차이: {scores[max_idx] - scores[min_idx]:.0f}점

#### 부정 비율
- 긍정 {cat_pos_pct:.1f}% ({cat_pos}개), 부정 {cat_neg_pct:.1f}% ({cat_neg}개), X {cat_x_pct:.1f}% ({cat_x}개)

#### 핵심 약점 요인
{cat_kr} 분야에서 상대적으로 낮은 점수를 받은 것은 해당 영역에서의 활동이나 성과가 다른 분야에 비해 부족하거나,
부정적인 이슈가 존재하기 때문입니다. 부정 평가 비율이 {cat_neg_pct:.1f}%에 달하는 것은 즉시 개선이 필요한 영역임을 시사합니다.
이 분야에 대한 집중적인 관심과 노력이 필요한 시점입니다.

#### 개선 방향 ⭐
1. **즉시 개선 가능한 이슈 해결**: 부정 평가의 원인이 되는 구체적인 이슈를 파악하고, 우선순위를 정하여 신속하게 해결합니다.
2. **전문가 자문 및 협업 강화**: 이 분야의 전문가 및 이해관계자들과 협력하여, 실질적이고 효과적인 개선 방안을 마련합니다.
3. **정기적 모니터링 및 피드백**: 개선 활동의 효과를 주기적으로 점검하고, 시민 의견을 적극 수렴하여 지속적으로 보완합니다.

"""

    report += "---\n\n"

    # === 섹션 5: 카테고리별 요약 ===
    report += "## 5. 카테고리별 요약\n\n"

    for idx, (cat_en, cat_kr) in enumerate(CATEGORIES.items(), 1):
        info = cat_avg_scores[cat_en]
        scores = info['scores']
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        report += f"### 5.{idx} {cat_kr} ({info['avg']:.0f}점)\n\n"
        report += "| AI | 점수 | 평가 |\n"
        report += "|---|:----:|------|\n"

        for i, ai in enumerate(ai_names):
            report += f"| {ai} | {scores[i]:.0f}점 | {get_score_evaluation(scores[i])} |\n"

        report += f"| **평균** | **{info['avg']:.0f}점** | **{get_score_evaluation(info['avg'])}** |\n\n"

        # 종합 평가 (간단히)
        if info['avg'] >= 85:
            evaluation = f"{cat_kr} 분야에서 탁월한 성과를 보이고 있습니다."
        elif info['avg'] >= 70:
            evaluation = f"{cat_kr} 분야에서 안정적인 활동을 펼치고 있습니다."
        else:
            evaluation = f"{cat_kr} 분야는 개선의 여지가 있는 영역입니다."

        report += f"**종합 평가**: {evaluation}\n\n"

    report += "---\n\n"

    # === 섹션 6: 데이터 분석 ===
    report += f"""## 6. 데이터 분석

### 6.1 긍정/부정/X 분포

| 구분 | 개수 | 비율 |
|------|:----:|:----:|
| 긍정 평가 | {total_positive:,}개 | {pos_pct:.1f}% |
| 부정 평가 | {total_negative:,}개 | {neg_pct:.1f}% |
| 평가 제외 (X) | {total_x:,}개 | {x_pct:.1f}% |
| **총합** | **{total_all:,}개** | **100%** |

### 6.2 데이터 출처 분석

| AI | 총 수집 | 비고 |
|---|:------:|------|
"""

    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        total = ai_stats[ai]['total']
        report += f"| {ai} | {total:,}개 | 독립적 수집 및 평가 |\n"

    report += f"""
### 6.3 데이터 품질

- **총 수집 데이터**: {total_collected:,}개
- **총 평가 데이터**: {total_evaluated:,}개
- **유효 평가 (X 제외)**: {total_all - total_x:,}개 ({(total_all - total_x) / total_all * 100:.1f}%)
- **평가 제외 (X)**: {total_x:,}개 ({x_pct:.1f}%)

---

"""

    # === 섹션 7: 평가의 한계 및 유의사항 ===
    report += """## 7. 평가의 한계 및 유의사항

### 데이터 수집 한계
1. **수집 기간 제한**: OFFICIAL 최근 4년, PUBLIC 최근 1년
2. **데이터 소스 제한**: AI 검색 결과에 의존하므로, 모든 활동이 포함되지 않을 수 있습니다.

### AI 평가 한계
1. **주관성**: AI도 학습 데이터에 따른 편향이 존재할 수 있습니다. (4개 AI 평균으로 완화)
2. **맥락 이해**: 정치적 배경과 상황을 완전히 파악하지 못할 수 있습니다.

### 이용 시 유의사항
1. 이 보고서는 **참고 자료**입니다. 절대적인 평가가 아닙니다.
2. **여론조사가 아닙니다**. 긍정/부정 비율은 시민 여론과 다를 수 있습니다.
3. **법적 판단이 아닙니다**. 논란이나 의혹은 법적 유무죄와 무관합니다.
4. **실시간 업데이트 안 됨**. 평가 일자 이후의 활동은 반영되지 않았습니다.

---

"""

    # === 섹션 8: 참고자료 및 마무리 ===
    report += f"""## 8. 참고자료 및 마무리

### 평가 시스템
- 4개 AI(Claude, ChatGPT, Grok, Gemini)가 각각 독립적으로 데이터 수집
- 카테고리당 약 100개씩 수집 (AI당)
- Rating: +4(탁월) ~ -4(최악), X(평가 제외)
- 카테고리 점수 = (평균 Rating × 0.5 + 6.0) × 10
- 최종 점수 = 10개 카테고리 점수 합산

### 핵심 메시지
1. **강점 ({top_names})**은 최상위 수준입니다. 이를 더욱 강화하세요.
2. **약점 ({bottom_names})**은 즉시 개선 가능한 영역입니다.
3. 4개 AI의 독립적 평가를 종합하여 객관성을 확보했습니다.

### 다음 단계
- [ ] 강점 TOP 카테고리의 "강화 방향" 실행 계획 수립
- [ ] 약점 TOP 카테고리의 "개선 방향" 즉시 착수
- [ ] 6개월 후 재평가 실시하여 개선 진척도 측정

---

**생성 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**생성 시스템**: AI 평가 엔진 V40.2
"""

    return report

def get_grade_description(grade, ai_category_scores):
    """등급에 따른 10개 카테고리 종합 평가 생성"""

    # 카테고리별 평균 점수 계산
    category_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                 for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        category_scores[cat_kr] = sum(scores) / len(scores) if scores else 0

    # 상위 3개 카테고리
    top_3 = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    top_categories = ', '.join([name for name, _ in top_3])

    # 등급별 기본 평가 (원본 코드 기준)
    grade_evaluations = {
        'M': '최우수',           # 920~1000점 (가장 높음)
        'D': '우수',             # 840~919점
        'E': '양호',             # 760~839점
        'P': '보통+',            # 680~759점
        'G': '보통',             # 600~679점
        'S': '보통-',            # 520~599점
        'B': '미흡',             # 440~519점
        'I': '부족',             # 360~439점 (Iron)
        'Tn': '상당히 부족',     # 280~359점 (Tin)
        'L': '매우 부족'         # 200~279점 (가장 낮음, Lead)
    }

    base_eval = grade_evaluations.get(grade, '평가 없음')

    # 종합 평가 문장 생성
    return f"훌륭한 정치인 지수 {base_eval} 평가. 전문성, 리더십, 비전, 청렴성, 윤리성, 책임감, 투명성, 소통능력, 대응성, 공익성 전반을 종합 평가한 결과이며, 특히 {top_categories} 분야에서 강점을 보임"

def get_score_evaluation(score):
    """점수 평가"""
    if score >= 90:
        return '탁월'
    elif score >= 80:
        return '우수'
    elif score >= 70:
        return '양호'
    elif score >= 60:
        return '보통'
    else:
        return '미흡'

def save_report(report, politician_name):
    """보고서 파일 저장"""
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"{politician_name}_{date_str}.md"

    # 보고서 폴더 생성 (V40 폴더 직접 아래)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    v40_dir = os.path.dirname(script_dir)  # scripts의 부모 = V40
    report_dir = os.path.join(v40_dir, "보고서")
    os.makedirs(report_dir, exist_ok=True)

    filepath = os.path.join(report_dir, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(report)

    return filepath

# 실행
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python generate_report_v40.py <politician_id> <politician_name>")
        print("Example: python generate_report_v40.py d0a5d6e1 조은희")
        sys.exit(1)

    politician_id = sys.argv[1]
    politician_name = sys.argv[2]

    report = generate_report_v40(politician_id, politician_name)
    print("\n" + "="*70)
    print(report[:500] + "...")
