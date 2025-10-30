#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
상세평가보고서 PDF 생성기
- 요약 2,000자
- 항목별 평가 25,000자 (100개 항목 × 250자)
- 종합평가 및 결론 3,000자
총 30,000자
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

# 한글 폰트 등록 (Windows 기본 폰트 사용)
try:
    pdfmetrics.registerFont(TTFont('NanumGothic', 'C:/Windows/Fonts/malgun.ttf'))
    FONT_NAME = 'NanumGothic'
except:
    print("한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
    FONT_NAME = 'Helvetica'

def create_styles():
    """PDF 스타일 정의"""
    styles = getSampleStyleSheet()

    # 제목 스타일
    styles.add(ParagraphStyle(
        name='KoreanTitle',
        fontName=FONT_NAME,
        fontSize=24,
        leading=30,
        alignment=1,  # 중앙 정렬
        spaceAfter=20
    ))

    # 부제목 스타일
    styles.add(ParagraphStyle(
        name='KoreanSubtitle',
        fontName=FONT_NAME,
        fontSize=16,
        leading=20,
        spaceAfter=12
    ))

    # 본문 스타일
    styles.add(ParagraphStyle(
        name='KoreanBody',
        fontName=FONT_NAME,
        fontSize=10,
        leading=14,
        spaceAfter=8
    ))

    # 항목 제목 스타일
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

def generate_summary(data, styles):
    """요약 섹션 생성 (2,000자)"""
    story = []

    # 제목
    story.append(Paragraph("정치인 종합평가 보고서", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    # 기본 정보
    politician = data['politician']
    score = data['total_score'] / 10  # 100점 만점으로 환산
    grade = data['grade']

    info_text = f"""
    <b>평가 대상:</b> {politician}<br/>
    <b>최종 점수:</b> {score:.2f}점 / 100점<br/>
    <b>등급:</b> {grade['emoji']} {grade['name']} ({grade['code']})<br/>
    <b>평가 데이터 수:</b> {data['total_data_count']}건<br/>
    <b>보고서 생성일:</b> {datetime.now().strftime('%Y년 %m월 %d일')}<br/>
    """
    story.append(Paragraph(info_text, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 분야별 점수
    story.append(Paragraph("<b>분야별 평가 점수</b>", styles['KoreanSubtitle']))

    category_data = []
    category_data.append(['분야', '점수 (10점 만점)'])

    for cat_id in sorted(data['categories'].keys(), key=lambda x: int(x)):
        cat = data['categories'][cat_id]
        category_data.append([
            cat['category_name'],
            f"{cat['category_score']:.2f}점"
        ])

    category_table = Table(category_data, colWidths=[120*mm, 50*mm])
    category_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))

    story.append(category_table)
    story.append(Spacer(1, 10*mm))

    # 전반적 평가
    story.append(Paragraph("<b>전반적 평가</b>", styles['KoreanSubtitle']))

    avg_score = score
    if avg_score >= 90:
        evaluation = f"{politician}은(는) 매우 우수한 평가를 받았습니다. 전 분야에 걸쳐 탁월한 성과를 보이고 있으며, 특히 높은 점수를 받은 분야에서 두각을 나타내고 있습니다."
    elif avg_score >= 80:
        evaluation = f"{politician}은(는) 우수한 평가를 받았습니다. 대부분의 분야에서 안정적인 성과를 보이고 있으며, 일부 분야에서 특히 강점을 보입니다."
    elif avg_score >= 70:
        evaluation = f"{politician}은(는) 양호한 평가를 받았습니다. 전반적으로 기준 이상의 성과를 보이고 있으나, 일부 분야에서 개선의 여지가 있습니다."
    elif avg_score >= 60:
        evaluation = f"{politician}은(는) 보통 수준의 평가를 받았습니다. 일부 분야에서 강점을 보이나, 전반적인 성과 향상이 필요합니다."
    else:
        evaluation = f"{politician}은(는) 개선이 필요한 평가를 받았습니다. 여러 분야에서 성과 향상을 위한 노력이 요구됩니다."

    story.append(Paragraph(evaluation, styles['KoreanBody']))
    story.append(PageBreak())

    return story

def generate_item_analysis(data, styles):
    """항목별 평가 섹션 생성 (100개 항목 × 250자)"""
    story = []

    story.append(Paragraph("<b>항목별 상세 평가</b>", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    for cat_id in sorted(data['categories'].keys(), key=lambda x: int(x)):
        cat = data['categories'][cat_id]

        # 분야 제목
        story.append(Paragraph(f"<b>{cat['category_name']}</b>", styles['KoreanSubtitle']))
        story.append(Spacer(1, 5*mm))

        for item in cat['items']:
            item_num = item['item_num']
            item_name = item['item_name']
            item_score = item['item_score']
            data_count = item['data_count']

            # 항목 제목
            story.append(Paragraph(
                f"<b>{cat_id}-{item_num}. {item_name}</b> (점수: {item_score:.2f}점, 데이터 {data_count}건)",
                styles['ItemTitle']
            ))

            # 강점과 개선할 점 분석
            strengths = []
            improvements = []

            for d in item['data'][:3]:  # 상위 3개 데이터만 사용
                if d['score'] > 0.5:
                    strengths.append(d['content'][:100])
                elif d['score'] < -0.5:
                    improvements.append(d['content'][:100])

            # 평가 내용
            eval_text = f"<b>평가 데이터:</b> {data_count}건의 데이터를 분석한 결과, "

            if item_score >= 8.0:
                eval_text += "매우 우수한 성과를 보이고 있습니다. "
            elif item_score >= 7.0:
                eval_text += "양호한 성과를 보이고 있습니다. "
            elif item_score >= 6.0:
                eval_text += "보통 수준의 성과를 보이고 있습니다. "
            else:
                eval_text += "개선이 필요한 것으로 평가됩니다. "

            if item['data']:
                sample_data = item['data'][0]
                eval_text += f"{sample_data['content'][:150]}... "

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
    """종합평가 및 결론 섹션 생성 (3,000자)"""
    story = []

    story.append(Paragraph("<b>종합평가 및 결론</b>", styles['KoreanTitle']))
    story.append(Spacer(1, 10*mm))

    politician = data['politician']
    score = data['total_score'] / 10

    # 분야별 분석
    story.append(Paragraph("<b>1. 분야별 종합 분석</b>", styles['KoreanSubtitle']))

    categories = data['categories']
    cat_scores = {cat_id: cat['category_score'] for cat_id, cat in categories.items()}

    # 상위 3개 분야
    top_3 = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    story.append(Paragraph("<b>강점 분야 (상위 3개):</b>", styles['KoreanBody']))
    for cat_id, score in top_3:
        cat_name = categories[cat_id]['category_name']
        story.append(Paragraph(f"• {cat_name}: {score:.2f}점 - 우수한 성과를 보이고 있습니다.", styles['KoreanBody']))

    story.append(Spacer(1, 5*mm))

    # 하위 3개 분야
    bottom_3 = sorted(cat_scores.items(), key=lambda x: x[1])[:3]
    story.append(Paragraph("<b>개선 필요 분야 (하위 3개):</b>", styles['KoreanBody']))
    for cat_id, score in bottom_3:
        cat_name = categories[cat_id]['category_name']
        story.append(Paragraph(f"• {cat_name}: {score:.2f}점 - 향후 개선이 필요합니다.", styles['KoreanBody']))

    story.append(Spacer(1, 10*mm))

    # 전체적인 강점
    story.append(Paragraph("<b>2. 전체적인 강점</b>", styles['KoreanSubtitle']))

    conclusion_text = f"""
    {politician}은(는) 종합 {score:.2f}점으로 {data['grade']['name']}({data['grade']['code']}) 등급을 받았습니다.
    총 {data['total_data_count']}건의 데이터를 기반으로 10개 분야 100개 항목을 평가한 결과,
    전반적으로 {'우수한' if score >= 75 else '양호한' if score >= 70 else '보통의'} 성과를 보이고 있습니다.

    특히 상위 분야에서는 일관되게 높은 점수를 유지하고 있으며, 이는 해당 분야에 대한
    지속적인 관심과 노력의 결과로 평가됩니다.
    """
    story.append(Paragraph(conclusion_text, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 전체적인 개선할 점
    story.append(Paragraph("<b>3. 전체적인 개선할 점</b>", styles['KoreanSubtitle']))

    improvement_text = f"""
    하위 분야들의 경우 상대적으로 낮은 점수를 받았으나, 이는 개선의 여지가 있음을 의미합니다.
    해당 분야들에 대한 집중적인 관심과 정책 개선을 통해 전반적인 평가 점수를 향상시킬 수 있을 것으로 기대됩니다.

    또한, 일부 항목에서는 데이터가 부족하거나 평가 근거가 제한적인 경우가 있어,
    향후 더 많은 데이터 수집을 통해 보다 정확한 평가가 이루어질 필요가 있습니다.
    """
    story.append(Paragraph(improvement_text, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 최종 의견
    story.append(Paragraph("<b>4. 최종 의견</b>", styles['KoreanSubtitle']))

    final_text = f"""
    본 평가는 공개된 자료와 데이터를 기반으로 객관적인 분석을 수행했습니다.
    Hierarchical Linear Evaluation Method with Bayesian Prior 방법론을 적용하여
    민주적 정당성 기준점(70점)을 기준으로 실제 성과를 평가했습니다.

    {politician}의 경우 전반적으로 {'기준을 상회하는' if score >= 70 else '기준에 근접하는'} 성과를 보이고 있으며,
    특히 강점 분야에서의 성과가 두드러집니다. 다만, 개선이 필요한 분야에 대한
    지속적인 관심과 노력이 요구됩니다.

    본 보고서가 {politician}의 활동을 객관적으로 이해하고, 향후 발전 방향을
    모색하는 데 도움이 되기를 바랍니다.
    """
    story.append(Paragraph(final_text, styles['KoreanBody']))
    story.append(Spacer(1, 10*mm))

    # 보고서 정보
    story.append(Paragraph("---", styles['KoreanBody']))
    story.append(Paragraph(
        f"본 보고서는 {datetime.now().strftime('%Y년 %m월 %d일')} 기준으로 작성되었습니다.",
        styles['KoreanBody']
    ))
    story.append(Paragraph(
        "평가 방법론: Hierarchical Linear Evaluation Method with Bayesian Prior V4.0",
        styles['KoreanBody']
    ))

    return story

def main():
    """메인 함수"""
    print("상세평가보고서 PDF 생성 시작...")

    # JSON 데이터 로드
    json_file = "G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/results_oh_sehoon_20251026_182403.json"

    print(f"데이터 파일 로드 중: {json_file}")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"데이터 로드 완료: {data['politician']}, {data['total_data_count']}건")

    # PDF 파일 생성
    pdf_file = f"G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/AI_Evaluation_Engine/상세평가보고서_{data['politician']}_{datetime.now().strftime('%Y%m%d')}.pdf"

    print(f"PDF 생성 중: {pdf_file}")
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        topMargin=20*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm
    )

    # 스타일 생성
    styles = create_styles()

    # 스토리 생성
    story = []

    print("1. 요약 섹션 생성 중...")
    story.extend(generate_summary(data, styles))

    print("2. 항목별 평가 섹션 생성 중...")
    story.extend(generate_item_analysis(data, styles))

    print("3. 종합평가 및 결론 섹션 생성 중...")
    story.extend(generate_conclusion(data, styles))

    # PDF 빌드
    print("PDF 파일 빌드 중...")
    doc.build(story)

    print(f"✅ PDF 생성 완료: {pdf_file}")
    print(f"파일 크기: {os.path.getsize(pdf_file) / 1024:.2f} KB")

if __name__ == "__main__":
    import os
    main()
