#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
상세평가보고서 PDF 생성기 V2.0 - 연구보고서 스타일
- 실제 데이터 기반 분석
- 구체적인 근거 제시
- 정책적 시사점 도출
"""

import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import statistics

# 한글 폰트 등록
try:
    pdfmetrics.registerFont(TTFont('NanumGothic', 'C:/Windows/Fonts/malgun.ttf'))
    FONT_NAME = 'NanumGothic'
except:
    FONT_NAME = 'Helvetica'

def create_styles():
    """PDF 스타일 정의"""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='KoreanTitle',
        fontName=FONT_NAME,
        fontSize=24,
        leading=30,
        alignment=1,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name='KoreanSubtitle',
        fontName=FONT_NAME,
        fontSize=16,
        leading=20,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name='KoreanBody',
        fontName=FONT_NAME,
        fontSize=10,
        leading=14,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        name='ItemTitle',
        fontName=FONT_NAME,
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        spaceBefore=10
    ))

    return styles

def analyze_data_distribution(data):
    """데이터 분포 분석"""
    all_scores = []
    positive_count = 0
    negative_count = 0
    neutral_count = 0

    for cat_id, cat in data['categories'].items():
        for item in cat['items']:
            for d in item['data']:
                score = d['score']
                all_scores.append(score)
                if score > 0.3:
                    positive_count += 1
                elif score < -0.3:
                    negative_count += 1
                else:
                    neutral_count += 1

    return {
        'mean': statistics.mean(all_scores) if all_scores else 0,
        'median': statistics.median(all_scores) if all_scores else 0,
        'stdev': statistics.stdev(all_scores) if len(all_scores) > 1 else 0,
        'positive_ratio': positive_count / len(all_scores) if all_scores else 0,
        'negative_ratio': negative_count / len(all_scores) if all_scores else 0,
        'neutral_ratio': neutral_count / len(all_scores) if all_scores else 0
    }

def generate_summary(data, styles):
    """연구보고서 스타일 요약 섹션"""
    story = []

    # 제목
    story.append(Paragraph("정치인 종합평가 연구보고서", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    politician = data['politician']
    score = data['total_score']
    grade = data['grade']

    # 기본 정보
    info_text = f"""
    <b>평가 대상:</b> {politician}<br/>
    <b>최종 점수:</b> {score:.2f}점 / 100점<br/>
    <b>등급:</b> {grade['emoji']} {grade['name']} ({grade['code']})<br/>
    <b>평가 데이터 수:</b> {data['total_data_count']}건<br/>
    <b>평가 기준일:</b> {datetime.now().strftime('%Y년 %m월 %d일')}<br/>
    <b>평가 방법론:</b> 계층적 선형 평가 방법<br/>
    """
    story.append(Paragraph(info_text, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 1. 연구 개요
    story.append(Paragraph("<b>1. 연구 개요</b>", styles['KoreanSubtitle']))

    overview = f"""
    본 연구는 {politician}의 정치 활동에 대한 종합적 평가를 목적으로 수행되었다.
    평가는 10개 주요 분야, 100개 세부 항목에 걸쳐 총 {data['total_data_count']}건의 공개 자료를
    수집·분석하여 이루어졌다. 평가 방법론으로는 계층적 선형 평가 방법을 적용하여
    실제 데이터에 기반한 객관적 점수를 산출하였다.

    본 평가는 객관적 자료에 근거한 정량적 분석과 질적 해석을 병행하여, {politician}의 정치 활동에 대한
    체계적이고 균형잡힌 평가를 제공하고자 한다.
    """
    story.append(Paragraph(overview, styles['KoreanBody']))
    story.append(Spacer(1, 8*mm))

    # 2. 평가 결과 요약
    story.append(Paragraph("<b>2. 평가 결과 요약</b>", styles['KoreanSubtitle']))

    # 데이터 분포 분석
    dist = analyze_data_distribution(data)

    # 분야별 점수 분석
    cat_scores = {cat_id: cat['category_score'] for cat_id, cat in data['categories'].items()}
    top_3 = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    bottom_3 = sorted(cat_scores.items(), key=lambda x: x[1])[:3]

    top_categories = ", ".join([data['categories'][cid]['category_name'].split('(')[0].strip()
                                for cid, _ in top_3])
    bottom_categories = ", ".join([data['categories'][cid]['category_name'].split('(')[0].strip()
                                   for cid, _ in bottom_3])

    summary_text = f"""
    {politician}은 종합 {score:.2f}점으로 {grade['name']}({grade['code']}) 등급을 획득하였다.
    전반적으로 {'긍정적인' if score >= 60 else '개선이 필요한'} 평가를 받았다.

    분석 대상 {data['total_data_count']}건의 데이터 중 긍정적 평가는 {dist['positive_ratio']*100:.1f}%,
    부정적 평가는 {dist['negative_ratio']*100:.1f}%, 중립적 평가는 {dist['neutral_ratio']*100:.1f}%로
    나타났다.

    분야별 분석 결과, {top_categories} 분야에서 상대적으로 높은 점수를 받았으며,
    {bottom_categories} 분야에서 상대적으로 낮은 점수를 받아 개선의 여지가 있는 것으로 평가되었다.
    """
    story.append(Paragraph(summary_text, styles['KoreanBody']))
    story.append(Spacer(1, 8*mm))

    # 분야별 점수 테이블
    story.append(Paragraph("<b>2.1 분야별 평가 점수</b>", styles['KoreanBody']))
    story.append(Spacer(1, 3*mm))

    category_data = [['순위', '분야', '점수', '평가']]

    sorted_cats = sorted(data['categories'].items(), key=lambda x: x[1]['category_score'], reverse=True)
    for rank, (cat_id, cat) in enumerate(sorted_cats, 1):
        cat_score = cat['category_score']
        if cat_score >= 9.0:
            evaluation = '우수'
        elif cat_score >= 8.0:
            evaluation = '양호'
        elif cat_score >= 7.0:
            evaluation = '보통'
        elif cat_score >= 6.0:
            evaluation = '미흡'
        else:
            evaluation = '개선필요'

        category_data.append([
            str(rank),
            cat['category_name'],
            f"{cat_score:.2f}점",
            evaluation
        ])

    cat_table = Table(category_data, colWidths=[15*mm, 95*mm, 25*mm, 25*mm])
    cat_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))

    story.append(cat_table)
    story.append(Spacer(1, 8*mm))

    # 3. 주요 발견사항
    story.append(Paragraph("<b>3. 주요 발견사항</b>", styles['KoreanSubtitle']))

    # 최고점 항목 찾기
    all_items = []
    for cat_id, cat in data['categories'].items():
        for item in cat['items']:
            all_items.append({
                'category': cat['category_name'],
                'name': item['item_name'],
                'score': item['item_score'],
                'data_count': item['data_count']
            })

    top_items = sorted(all_items, key=lambda x: x['score'], reverse=True)[:3]
    bottom_items = sorted(all_items, key=lambda x: x['score'])[:3]

    findings = f"""
    <b>3.1 강점 항목</b><br/>
    평가 항목 중 가장 높은 점수를 받은 항목들은 다음과 같다:<br/>
    """

    for i, item in enumerate(top_items, 1):
        findings += f"• {item['category'].split('(')[0].strip()} - {item['name']}: {item['score']:.2f}점 (데이터 {item['data_count']}건)<br/>"

    findings += f"""
    <br/>
    <b>3.2 개선 필요 항목</b><br/>
    상대적으로 낮은 점수를 받아 향후 개선이 필요한 항목들은 다음과 같다:<br/>
    """

    for i, item in enumerate(bottom_items, 1):
        findings += f"• {item['category'].split('(')[0].strip()} - {item['name']}: {item['score']:.2f}점 (데이터 {item['data_count']}건)<br/>"

    story.append(Paragraph(findings, styles['KoreanBody']))
    story.append(PageBreak())

    return story

def generate_item_analysis(data, styles):
    """항목별 평가 (기존과 동일)"""
    story = []

    story.append(Paragraph("<b>항목별 상세 평가</b>", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    for cat_id in sorted(data['categories'].keys(), key=lambda x: int(x)):
        cat = data['categories'][cat_id]

        story.append(Paragraph(f"<b>{cat['category_name']}</b>", styles['KoreanSubtitle']))
        story.append(Spacer(1, 5*mm))

        for item in cat['items']:
            item_num = item['item_num']
            item_name = item['item_name']
            item_score = item['item_score']
            data_count = item['data_count']

            story.append(Paragraph(
                f"<b>{cat_id}-{item_num}. {item_name}</b> (점수: {item_score:.2f}점, 데이터 {data_count}건)",
                styles['ItemTitle']
            ))

            # 강점과 개선할 점
            strengths = []
            improvements = []

            for d in item['data'][:5]:
                if d['score'] > 0.5:
                    strengths.append(d['content'][:120])
                elif d['score'] < -0.5:
                    improvements.append(d['content'][:120])

            # 평가 내용
            if item['data']:
                sample = item['data'][0]
                eval_text = f"<b>평가 데이터:</b> {sample['content'][:200]}... "
                story.append(Paragraph(eval_text, styles['KoreanBody']))

            # 강점
            if strengths:
                story.append(Paragraph("<b>강점:</b>", styles['KoreanBody']))
                for s in strengths[:2]:
                    story.append(Paragraph(f"• {s}...", styles['KoreanBody']))

            # 개선할 점
            if improvements:
                story.append(Paragraph("<b>개선할 점:</b>", styles['KoreanBody']))
                for i in improvements[:2]:
                    story.append(Paragraph(f"• {i}...", styles['KoreanBody']))
            elif item_score < 7.0:
                story.append(Paragraph(
                    "<b>개선할 점:</b> 해당 분야의 성과 향상을 위한 지속적인 노력이 필요합니다.",
                    styles['KoreanBody']
                ))

            # 출처
            if item['data']:
                sources = set([d['source'] for d in item['data'][:3]])
                story.append(Paragraph(
                    f"<i>(출처: {', '.join(list(sources)[:2])})</i>",
                    styles['KoreanBody']
                ))

            story.append(Spacer(1, 5*mm))

        story.append(PageBreak())

    return story

def generate_conclusion(data, styles):
    """연구보고서 스타일 결론"""
    story = []

    story.append(Paragraph("<b>종합평가 및 결론</b>", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    politician = data['politician']
    score = data['total_score']

    # 1. 평가 종합
    story.append(Paragraph("<b>1. 평가 종합</b>", styles['KoreanSubtitle']))

    dist = analyze_data_distribution(data)

    conclusion_1 = f"""
    본 연구는 {politician}의 정치 활동에 대해 10개 분야 100개 항목 총 {data['total_data_count']}건의
    데이터를 체계적으로 수집·분석하여 객관적 평가를 수행하였다.

    평가 결과 종합 {score:.2f}점으로 {data['grade']['name']}({data['grade']['code']}) 등급을 획득하였다.

    데이터 분석 결과, 전체 데이터의 {dist['positive_ratio']*100:.1f}%가 긍정적 평가를 받았으며,
    부정적 평가는 {dist['negative_ratio']*100:.1f}%로 나타났다.
    """
    story.append(Paragraph(conclusion_1, styles['KoreanBody']))
    story.append(Spacer(1, 8*mm))

    # 2. 분야별 심층 분석
    story.append(Paragraph("<b>2. 분야별 심층 분석</b>", styles['KoreanSubtitle']))

    categories = data['categories']
    cat_scores = [(cid, cat['category_score'], cat['category_name'])
                  for cid, cat in categories.items()]
    cat_scores_sorted = sorted(cat_scores, key=lambda x: x[1], reverse=True)

    top_3 = cat_scores_sorted[:3]
    bottom_3 = cat_scores_sorted[-3:]

    analysis_text = "<b>2.1 우수 분야</b><br/>"
    for cid, score, name in top_3:
        cat = categories[cid]
        top_item = max(cat['items'], key=lambda x: x['item_score'])
        analysis_text += f"• <b>{name}</b> ({score:.2f}점): {top_item['item_name']} 등의 항목에서 높은 평가를 받음<br/>"

    analysis_text += "<br/><b>2.2 개선 필요 분야</b><br/>"
    for cid, score, name in bottom_3:
        cat = categories[cid]
        bottom_item = min(cat['items'], key=lambda x: x['item_score'])
        analysis_text += f"• <b>{name}</b> ({score:.2f}점): {bottom_item['item_name']} 등의 항목에서 개선 필요<br/>"

    story.append(Paragraph(analysis_text, styles['KoreanBody']))
    story.append(Spacer(1, 8*mm))

    # 3. 정책적 시사점
    story.append(Paragraph("<b>3. 정책적 시사점</b>", styles['KoreanSubtitle']))

    implications = f"""
    본 평가 결과는 {politician}의 정치 활동에 대한 다음과 같은 정책적 시사점을 제공한다.

    첫째, 상위 분야의 강점을 지속적으로 유지·발전시킬 필요가 있다.
    특히 높은 점수를 받은 분야는 {politician}의 핵심 역량으로 평가되며,
    이를 정치적 자산으로 활용할 수 있다.

    둘째, 하위 분야에 대한 집중적인 개선 노력이 요구된다.
    상대적으로 낮은 점수를 받은 분야는 향후 정책적 우선순위를 두고
    체계적인 개선 계획을 수립할 필요가 있다.

    셋째, 데이터 투명성 제고가 필요하다. 일부 항목의 경우
    평가 근거가 되는 데이터가 제한적이어서 보다 정확한 평가를 위해서는
    관련 정보의 공개와 투명성 강화가 요구된다.
    """
    story.append(Paragraph(implications, styles['KoreanBody']))
    story.append(Spacer(1, 8*mm))

    # 4. 결론
    story.append(Paragraph("<b>4. 결론</b>", styles['KoreanSubtitle']))

    final_conclusion = f"""
    본 연구는 {politician}의 정치 활동에 대한 체계적이고 객관적인 평가를 통해
    종합 {score:.2f}점, {data['grade']['name']}({data['grade']['code']}) 등급이라는 결론에 도달하였다.

    이는 {data['total_data_count']}건의 공개 데이터에 기반한 실증적 분석 결과로서,
    {politician}의 정치 활동에 대한 균형잡힌 시각을 제공한다.

    본 평가는 특정 시점의 데이터에 기반하고 있으며, 향후 추가 데이터 수집과
    지속적인 모니터링을 통해 더욱 정교한 평가가 가능할 것으로 기대된다.

    궁극적으로 본 보고서가 {politician}의 정치 활동을 객관적으로 이해하고,
    향후 발전 방향을 모색하는 데 유익한 참고자료가 되기를 기대한다.
    """
    story.append(Paragraph(final_conclusion, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 보고서 정보
    story.append(Paragraph("---", styles['KoreanBody']))
    story.append(Paragraph(
        f"<i>본 보고서는 {datetime.now().strftime('%Y년 %m월 %d일')} 기준으로 작성되었습니다.</i>",
        styles['KoreanBody']
    ))
    story.append(Paragraph(
        "<i>평가 방법론: 계층적 선형 평가 방법</i>",
        styles['KoreanBody']
    ))

    return story

def main():
    """메인 함수"""
    print("Research-style Report PDF Generation Started...")

    json_file = "G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/results_oh_sehoon_20251026_182403.json"

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pdf_file = f"G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/상세평가보고서_{data['politician']}_{datetime.now().strftime('%Y%m%d')}.pdf"

    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        topMargin=20*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm
    )

    styles = create_styles()
    story = []

    print("1. Summary section...")
    story.extend(generate_summary(data, styles))

    print("2. Item analysis section...")
    story.extend(generate_item_analysis(data, styles))

    print("3. Conclusion section...")
    story.extend(generate_conclusion(data, styles))

    print("Building PDF...")
    doc.build(story)

    print(f"PDF Generated: {pdf_file}")

if __name__ == "__main__":
    import os
    main()
