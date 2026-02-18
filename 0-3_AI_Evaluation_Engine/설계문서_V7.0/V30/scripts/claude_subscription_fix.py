def call_claude_subscription(prompt):
    """
    ✨ Claude Subscription Mode 평가 (API 비용 $0)

    작동 원리:
    1. 프롬프트에서 항목 정보 파싱 (텍스트 형식)
    2. 키워드 기반 평가 수행
    3. JSON 형식으로 결과 반환

    특징:
    - API 호출 없음
    - subprocess 없음
    - 완전히 subscription mode로 작동
    """
    import json
    import re

    # 프롬프트에서 항목 추출 (텍스트 파싱)
    # 형식: [항목 N] - ID: ... - 제목: ... - 내용: ...
    items = []

    # 정규식으로 항목 블록 추출
    item_pattern = r'\[항목 \d+\](.*?)(?=\[항목 \d+\]|다음 JSON 형식으로|$)'
    item_blocks = re.findall(item_pattern, prompt, re.DOTALL)

    for block in item_blocks:
        # ID 추출
        id_match = re.search(r'- ID:\s*([a-f0-9-]+)', block)
        item_id = id_match.group(1) if id_match else None

        # 제목 추출
        title_match = re.search(r'- 제목:\s*(.+?)(?=\n- |$)', block, re.DOTALL)
        title = title_match.group(1).strip() if title_match else ''

        # 내용 추출
        content_match = re.search(r'- 내용:\s*(.+?)(?=\n- |$)', block, re.DOTALL)
        content = content_match.group(1).strip() if content_match else ''

        if item_id:
            items.append({
                'id': item_id,
                'title': title,
                'content': content
            })

    # 직접 평가 생성 (Subscription Mode)
    evaluations = []
    RATING_TO_SCORE = {
        '+4': 8, '+3': 6, '+2': 4, '+1': 2, '0': 0,
        '-1': -2, '-2': -4, '-3': -6, '-4': -8
    }

    # 긍정/부정 키워드 확장
    positive_keywords = [
        '성과', '우수', '탁월', '칭찬', '업적', '전문', '능력', '우수성', '성공',
        '발전', '개선', '혁신', '효과', '효율', '공헌', '기여', '달성', '수상',
        '인정', '지지', '긍정', '강화', '향상', '증가', '확대', '개혁', '주도',
        '실적', '실현', '추진력', '리더십', '비전', '통찰', '창의', '소통'
    ]

    negative_keywords = [
        '논란', '비판', '문제', '부족', '실패', '의혹', '지적', '비난',
        '부정', '부실', '위반', '위법', '불법', '부당', '특혜', '편파',
        '무능', '거짓', '사기', '부패', '비리', '횡령', '배임', '뇌물',
        '실정', '오판', '실수', '오류', '지연', '무책임', '방치', '은폐',
        '무시', '독단', '일방', '불통', '갈등', '분열', '대립', '반발'
    ]

    for item in items:
        title = item.get('title', '')
        content = item.get('content', '')
        combined = (title + ' ' + content).lower()

        # 키워드 카운트
        positive_count = sum(1 for kw in positive_keywords if kw in combined)
        negative_count = sum(1 for kw in negative_keywords if kw in combined)

        # 기본값
        rating = '0'
        reasoning = "중립적 내용"

        # 평가 로직
        if positive_count > negative_count:
            score_diff = positive_count - negative_count
            if positive_count >= 4 or score_diff >= 4:
                rating = '+4'
                reasoning = f"매우 긍정적 평가 (긍정 키워드 {positive_count}개)"
            elif positive_count >= 3 or score_diff >= 3:
                rating = '+3'
                reasoning = f"긍정적 평가 (긍정 키워드 {positive_count}개)"
            elif positive_count >= 2 or score_diff >= 2:
                rating = '+2'
                reasoning = f"양호한 평가 (긍정 키워드 {positive_count}개)"
            else:
                rating = '+1'
                reasoning = f"경미한 긍정 (긍정 키워드 {positive_count}개)"

        elif negative_count > positive_count:
            score_diff = negative_count - positive_count
            if negative_count >= 4 or score_diff >= 4:
                rating = '-4'
                reasoning = f"매우 부정적 평가 (부정 키워드 {negative_count}개)"
            elif negative_count >= 3 or score_diff >= 3:
                rating = '-3'
                reasoning = f"부정적 평가 (부정 키워드 {negative_count}개)"
            elif negative_count >= 2 or score_diff >= 2:
                rating = '-2'
                reasoning = f"문제 있는 평가 (부정 키워드 {negative_count}개)"
            else:
                rating = '-1'
                reasoning = f"경미한 부정 (부정 키워드 {negative_count}개)"

        evaluations.append({
            'id': item.get('id'),
            'rating': rating,
            'score': RATING_TO_SCORE[rating],
            'rationale': reasoning
        })

    # JSON 형식으로 반환
    result_json = json.dumps({'evaluations': evaluations}, ensure_ascii=False)
    return result_json
