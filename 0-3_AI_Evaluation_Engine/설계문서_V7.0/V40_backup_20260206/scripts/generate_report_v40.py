# generate_report_v40.py
import os
import json
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
    """V40 보고서 마크다운 생성"""

    # JSONB 데이터 파싱
    ai_final_scores = final_scores.get('ai_final_scores', {})
    if isinstance(ai_final_scores, str):
        ai_final_scores = json.loads(ai_final_scores)

    ai_category_scores = final_scores.get('ai_category_scores', {})
    if isinstance(ai_category_scores, str):
        ai_category_scores = json.loads(ai_category_scores)

    # 실제 데이터 수 계산
    total_collected = len(collected_data)
    total_evaluated = len(evaluations)

    # 등급 설명
    grade_code = final_scores['grade']
    grade_name = ''
    for min_s, max_s, code, name in GRADE_BOUNDARIES:
        if code == grade_code:
            grade_name = name
            break

    grade_eval_map = {
        'M': '최우수', 'D': '우수', 'E': '양호', 'P': '보통+', 'G': '보통',
        'S': '보통-', 'B': '미흡', 'I': '부족', 'Tn': '상당히 부족', 'L': '매우 부족'
    }
    grade_eval = grade_eval_map.get(grade_code, '')

    report = f"""# {politician_name} AI 기반 정치인 상세평가보고서

**평가 일자**: {datetime.now().strftime('%Y-%m-%d')}
**데이터 수집**: Google 검색 및 웹 페칭, Naver 검색 API
**평가 AI**: Claude, ChatGPT, Grok, Gemini

---

## 종합 점수

### 최종 점수 및 종합 평가
- **최종 점수**: {final_scores['final_score']}점 / 1,000점
- **등급**: {grade_code} ({grade_name} - {grade_eval})
- **종합 평가**: {get_grade_description(final_scores['grade'], ai_category_scores)}

### AI별 최종 점수

| AI | 점수 |
|---|:---:|
"""

    # AI별 점수 정렬 (높은 순)
    ai_scores_sorted = sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True)

    for ai, score in ai_scores_sorted:
        report += f"| {ai} | {score}점 |\n"

    # 평균 점수 추가
    avg_score = final_scores['final_score']
    report += f"| **4 AIs 평균** | **{avg_score}점** |\n"

    report += f"""

### 카테고리별 점수 (4 AIs 평균)

| 카테고리 | 점수 | 평가 |
|---------|:----:|------|
"""

    # 카테고리별 평균 점수 계산 및 강점/약점 분석
    category_avg_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        cat_scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                     for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        avg_score = sum(cat_scores) / len(cat_scores) if cat_scores else 0
        category_avg_scores[cat_kr] = avg_score

        report += f"| {cat_kr} ({cat_en.title()}) | {avg_score:.0f}점 | {get_score_evaluation(avg_score)} |\n"

    # 상세 평가 (카테고리별 상세 평가보다 먼저)
    report += f"""

---

## 상세 평가

"""

    # 카테고리별 영문명 매핑
    cat_kr_to_en = {v: k for k, v in CATEGORIES.items()}

    # 전체 긍정/부정 평가 수집
    all_positive = [ev for ev in evaluations if ev['rating'] in ['+4', '+3']]
    all_negative = [ev for ev in evaluations if ev['rating'] in ['-3', '-4']]

    # 데이터 수 계산
    positive_count = sum(1 for ev in evaluations if ev['rating'] in ['+4', '+3', '+2', '+1'])
    negative_count = sum(1 for ev in evaluations if ev['rating'] in ['-1', '-2', '-3', '-4'])
    positive_ratio = (positive_count / (positive_count + negative_count) * 100) if (positive_count + negative_count) > 0 else 0
    negative_ratio = (negative_count / (positive_count + negative_count) * 100) if (positive_count + negative_count) > 0 else 0

    # 1. 긍정 평가
    if all_positive:
        report += f"**긍정 평가:** (총 {positive_count:,}개, {positive_ratio:.1f}%)\n\n"
        # 상위 8개 긍정 평가
        positive_samples = sorted(all_positive,
                                 key=lambda x: x['rating'],
                                 reverse=True)[:8]
        for i, ev in enumerate(positive_samples, 1):
            reasoning = ev.get('reasoning', '평가 없음')[:100]
            report += f"{i}. {reasoning}\n"
        report += "\n"

    # 2. 부정 평가
    if all_negative:
        report += f"**부정 평가:** (총 {negative_count:,}개, {negative_ratio:.1f}%)\n\n"
        # 하위 5개 부정 평가
        negative_samples = sorted(all_negative,
                                 key=lambda x: x['rating'])[:5]
        for i, ev in enumerate(negative_samples, 1):
            reasoning = ev.get('reasoning', '평가 없음')[:100]
            report += f"{i}. {reasoning}\n"
        report += "\n"

    # 데이터 수 요약
    report += f"**데이터 수:**\n\n"
    report += f"- 수집: {total_collected:,}개\n"
    report += f"- 평가: {total_evaluated:,}개\n\n"

    # 3. 강점 분석
    strengths = [(cat, score) for cat, score in category_avg_scores.items() if score >= 80]
    strengths.sort(key=lambda x: x[1], reverse=True)

    if strengths:
        report += "**강점 분석:**\n\n"
        report += "위의 긍정 평가를 종합하면, 다음 카테고리에서 강점을 보입니다:\n\n"
        for cat_kr, score in strengths:
            report += f"- **{cat_kr} ({score:.0f}점)**: "

            # 해당 카테고리 특징 분석
            cat_en = cat_kr_to_en.get(cat_kr)
            if cat_en:
                cat_positive = [ev for ev in evaluations
                               if ev['category'] == cat_en and ev['rating'] in ['+4', '+3']]
                if len(cat_positive) > 0:
                    report += f"{len(cat_positive)}건의 우수 평가, "
                    # 대표 사례 1개
                    top_case = sorted(cat_positive, key=lambda x: x['rating'], reverse=True)[0]
                    reasoning_short = top_case.get('reasoning', '')[:60]
                    report += f"대표 사례: {reasoning_short}...\n"
                else:
                    report += "양호한 수준 유지\n"
            else:
                report += f"{get_score_evaluation(score)} 수준\n"
        report += "\n"

    # 4. 약점 분석
    weaknesses = [(cat, score) for cat, score in category_avg_scores.items() if score < 70]
    weaknesses.sort(key=lambda x: x[1])

    if weaknesses:
        report += "**약점 분석:**\n\n"
        report += "위의 부정 평가를 종합하면, 다음 카테고리에서 개선이 필요합니다:\n\n"
        for cat_kr, score in weaknesses:
            report += f"- **{cat_kr} ({score:.0f}점)**: "

            # 해당 카테고리 특징 분석
            cat_en = cat_kr_to_en.get(cat_kr)
            if cat_en:
                cat_negative = [ev for ev in evaluations
                               if ev['category'] == cat_en and ev['rating'] in ['-3', '-4']]
                if len(cat_negative) > 0:
                    report += f"{len(cat_negative)}건의 부정 평가, "
                    # 대표 사례 1개
                    worst_case = sorted(cat_negative, key=lambda x: x['rating'])[0]
                    reasoning_short = worst_case.get('reasoning', '')[:60]
                    report += f"주요 이슈: {reasoning_short}...\n"
                else:
                    report += "개선 필요\n"
            else:
                report += f"{get_score_evaluation(score)} 수준\n"
        report += "\n"
    else:
        report += "**약점 분석:**\n\n"
        report += "모든 카테고리에서 70점 이상을 기록하여 특별한 약점이 발견되지 않았습니다.\n\n"

    # 카테고리별 상세 평가
    report += f"""
---

## 카테고리별 상세 평가

"""

    for cat_en, cat_kr in CATEGORIES.items():
        analysis = category_analysis[cat_en]

        report += f"""

### {cat_kr} ({cat_en.title()})

**수집 현황:**

| Collector | OFFICIAL | PUBLIC | 합계 |
|-----------|:--------:|:------:|:----:|
"""

        # 수집 현황 테이블
        collection_status = analysis['collection_status']
        total_official = 0
        total_public = 0
        total_collected = 0

        for collector in ['Gemini', 'Naver']:
            status = collection_status.get(collector, {'official': 0, 'public': 0, 'total': 0})
            official = status['official']
            public = status['public']
            total = status['total']

            total_official += official
            total_public += public
            total_collected += total

            report += f"| {collector} | {official}개 | {public}개 | {total}개 |\n"

        report += f"| **합계** | **{total_official}개** | **{total_public}개** | **{total_collected}개** |\n"

        report += f"""

**AI별 평가:**

| AI | 평가 수 | X 제외 |
|---|:------:|:------:|
"""

        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            ai_score = analysis['ai_scores'][ai]
            report += f"| {ai} | {ai_score['evaluated'] + ai_score['excluded']}개 | {ai_score['excluded']}개 |\n"

        # 긍정 평가 사례
        positive_cases = analysis.get('positive_cases', [])
        if positive_cases:
            report += "\n**대표 긍정 평가:**\n\n"
            for i, case in enumerate(positive_cases[:3], 1):
                data = case.get('data', {})
                ev = case['evaluation']
                rating = ev.get('rating', '')
                reasoning = ev.get('reasoning', '평가 없음')[:150]
                evaluator = ev.get('evaluator_ai', 'Unknown')

                # data가 있으면 제목 포함, 없으면 reasoning만
                if data and data.get('title'):
                    title = data.get('title', '')[:80]
                    report += f"{i}. **[{evaluator}]** {title} `({rating})`\n"
                    report += f"   - {reasoning}\n\n"
                else:
                    report += f"{i}. **[{evaluator}]** `({rating})`\n"
                    report += f"   - {reasoning}\n\n"

        # 부정 평가 사례
        negative_cases = analysis.get('negative_cases', [])
        if negative_cases:
            report += "\n**대표 부정 평가:**\n\n"
            for i, case in enumerate(negative_cases[:2], 1):
                data = case.get('data', {})
                ev = case['evaluation']
                rating = ev.get('rating', '')
                reasoning = ev.get('reasoning', '평가 없음')[:150]
                evaluator = ev.get('evaluator_ai', 'Unknown')

                # data가 있으면 제목 포함, 없으면 reasoning만
                if data and data.get('title'):
                    title = data.get('title', '')[:80]
                    report += f"{i}. **[{evaluator}]** {title} `({rating})`\n"
                    report += f"   - {reasoning}\n\n"
                else:
                    report += f"{i}. **[{evaluator}]** `({rating})`\n"
                    report += f"   - {reasoning}\n\n"

    report += f"""

---

**생성 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**생성 시스템**: AI 평가 엔진 V40.0
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
