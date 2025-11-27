"""
정치인 평가 순위표 이미지 생성기 - 표 형식
PIL/Pillow만 사용
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 출력 경로
OUTPUT_DIR = r"C:\Development_PoliticianFinder\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V6.0"

# 이미지 크기
WIDTH = 1080
HEIGHT = 1600

# 등급 전체 이름
GRADE_NAMES = {
    'M': 'Master',
    'D': 'Diamond',
    'E': 'Emerald',
    'P': 'Platinum',
    'G': 'Gold',
    'S': 'Silver',
}

# 데이터
DATA = {
    '서울시장': [
        {'rank': 1, 'name': '정원오', 'party': '민주당', 'score': 854, 'grade': 'D'},
        {'rank': 2, 'name': '박주민', 'party': '민주당', 'score': 832, 'grade': 'E'},
        {'rank': 3, 'name': '오세훈', 'party': '국민의힘', 'score': 793, 'grade': 'E'},
        {'rank': 4, 'name': '조은희', 'party': '국민의힘', 'score': 764, 'grade': 'E'},
        {'rank': 5, 'name': '김민석', 'party': '민주당', 'score': 758, 'grade': 'P'},
        {'rank': 6, 'name': '이준석', 'party': '개혁신당', 'score': 744, 'grade': 'P'},
        {'rank': 7, 'name': '전현희', 'party': '민주당', 'score': 739, 'grade': 'P'},
        {'rank': 8, 'name': '나경원', 'party': '국민의힘', 'score': 706, 'grade': 'P'},
        {'rank': 9, 'name': '한동훈', 'party': '국민의힘', 'score': 625, 'grade': 'G'},
        {'rank': 10, 'name': '신동욱', 'party': '국민의힘', 'score': 604, 'grade': 'G'},
    ],
    '경기도지사': [
        {'rank': 1, 'name': '김동연', 'party': '민주당', 'score': 853, 'grade': 'D'},
        {'rank': 2, 'name': '염태영', 'party': '민주당', 'score': 808, 'grade': 'E'},
        {'rank': 3, 'name': '유승민', 'party': '국민의힘', 'score': 805, 'grade': 'E'},
        {'rank': 4, 'name': '김성원', 'party': '국민의힘', 'score': 804, 'grade': 'E'},
        {'rank': 5, 'name': '송석준', 'party': '국민의힘', 'score': 765, 'grade': 'E'},
        {'rank': 6, 'name': '한준호', 'party': '민주당', 'score': 748, 'grade': 'P'},
        {'rank': 7, 'name': '원유철', 'party': '국민의힘', 'score': 721, 'grade': 'P'},
        {'rank': 8, 'name': '추미애', 'party': '민주당', 'score': 710, 'grade': 'P'},
        {'rank': 9, 'name': '김병주', 'party': '민주당', 'score': 648, 'grade': 'G'},
        {'rank': 10, 'name': '김선교', 'party': '국민의힘', 'score': 592, 'grade': 'S'},
    ],
    '부산시장': [
        {'rank': 1, 'name': '최인호', 'party': '민주당', 'score': 784, 'grade': 'E'},
        {'rank': 2, 'name': '이재성', 'party': '민주당', 'score': 761, 'grade': 'E'},
        {'rank': 3, 'name': '김도읍', 'party': '국민의힘', 'score': 754, 'grade': 'P'},
        {'rank': 4, 'name': '박수영', 'party': '민주당', 'score': 754, 'grade': 'P'},
        {'rank': 5, 'name': '전재수', 'party': '민주당', 'score': 751, 'grade': 'P'},
        {'rank': 6, 'name': '조경태', 'party': '국민의힘', 'score': 742, 'grade': 'P'},
        {'rank': 7, 'name': '이진복', 'party': '국민의힘', 'score': 712, 'grade': 'P'},
        {'rank': 8, 'name': '홍순헌', 'party': '국민의힘', 'score': 704, 'grade': 'P'},
        {'rank': 9, 'name': '박형준', 'party': '국민의힘', 'score': 702, 'grade': 'P'},
        {'rank': 10, 'name': '차정인', 'party': '민주당', 'score': 679, 'grade': 'G'},
    ],
}

def get_font(size, bold=False):
    """폰트 로드"""
    font_paths = [
        "C:\\Windows\\Fonts\\malgunbd.ttf" if bold else "C:\\Windows\\Fonts\\malgun.ttf",
        "C:\\Windows\\Fonts\\malgun.ttf",
        "C:\\Windows\\Fonts\\gulim.ttf",
    ]
    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size)
        except:
            continue
    return ImageFont.load_default()

def create_ranking_image(title, data, filename):
    """표 형식 순위표 이미지 생성"""
    img = Image.new('RGB', (WIDTH, HEIGHT), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 폰트 (크기 키움)
    font_title = get_font(48, bold=True)
    font_subtitle = get_font(38, bold=True)
    font_header = get_font(30, bold=True)
    font_cell = get_font(32)
    font_footer = get_font(22)

    # 색상
    BLACK = (0, 0, 0)
    WHITE = (255, 255, 255)
    GRAY = (100, 100, 100)
    CLAUDE_ORANGE = (217, 119, 6)  # Claude 브랜드 색상
    PF_ORANGE = (255, 107, 0)  # PoliticianFinder 메인 주황색
    HEADER_BG = (255, 107, 0)  # 헤더도 주황색으로
    ROW_ALT = (255, 245, 235)  # 연한 주황 톤
    LINE_COLOR = (230, 230, 230)

    # 정당 색상
    PARTY_COLORS = {
        '민주당': (0, 78, 162),
        '국민의힘': (230, 30, 43),
        '개혁신당': (255, 102, 0),
    }

    # 등급 색상
    GRADE_COLORS = {
        'Diamond': (0, 119, 204),
        'Emerald': (0, 136, 68),
        'Platinum': (85, 85, 85),
        'Gold': (204, 136, 0),
        'Silver': (128, 128, 128),
        'Master': (184, 134, 11),
    }

    # 제목 영역
    draw.text((WIDTH//2, 50), f"2026 지방선거 {title} 출마 거론자",
              fill=BLACK, font=font_title, anchor="mm")

    # Claude AI 강조 (크게)
    draw.text((WIDTH//2, 105), "Claude AI 평가 순위표",
              fill=CLAUDE_ORANGE, font=font_subtitle, anchor="mm")
    draw.text((WIDTH//2, 145), "V24.0 | 10개 분야 × 분야별 50개 데이터 분석",
              fill=GRAY, font=font_footer, anchor="mm")

    # 표 설정
    table_top = 170
    row_height = 115
    col_widths = [80, 180, 200, 280, 280]  # 순위, 이름, 정당, 점수, 등급
    col_x = [40]  # 시작 x좌표
    for w in col_widths:
        col_x.append(col_x[-1] + w)

    # 헤더 배경 (진한 남색)
    draw.rectangle([col_x[0], table_top, col_x[-1], table_top + row_height],
                   fill=HEADER_BG)

    # 헤더 텍스트 (흰색)
    headers = ["순위", "이름", "소속정당", "AI 평가점수", "등급"]
    for i, header in enumerate(headers):
        cx = col_x[i] + col_widths[i] // 2
        draw.text((cx, table_top + row_height//2), header,
                  fill=WHITE, font=font_header, anchor="mm")

    # 데이터 행
    for idx, person in enumerate(data):
        y = table_top + row_height + idx * row_height

        # 행 배경 (짝수행 약간 회색)
        if idx % 2 == 1:
            draw.rectangle([col_x[0], y, col_x[-1], y + row_height],
                           fill=ROW_ALT)

        # 순위
        cx = col_x[0] + col_widths[0] // 2
        draw.text((cx, y + row_height//2), str(person['rank']),
                  fill=BLACK, font=font_cell, anchor="mm")

        # 이름
        cx = col_x[1] + col_widths[1] // 2
        draw.text((cx, y + row_height//2), person['name'],
                  fill=BLACK, font=font_cell, anchor="mm")

        # 정당 (색상 적용)
        cx = col_x[2] + col_widths[2] // 2
        party_color = PARTY_COLORS.get(person['party'], BLACK)
        draw.text((cx, y + row_height//2), person['party'],
                  fill=party_color, font=font_cell, anchor="mm")

        # 점수
        cx = col_x[3] + col_widths[3] // 2
        draw.text((cx, y + row_height//2), f"{person['score']}점",
                  fill=BLACK, font=font_cell, anchor="mm")

        # 등급 (색상 적용)
        cx = col_x[4] + col_widths[4] // 2
        grade_name = GRADE_NAMES.get(person['grade'], person['grade'])
        grade_color = GRADE_COLORS.get(grade_name, BLACK)
        draw.text((cx, y + row_height//2), grade_name,
                  fill=grade_color, font=font_cell, anchor="mm")

        # 행 하단 선
        draw.line([col_x[0], y + row_height, col_x[-1], y + row_height],
                  fill=LINE_COLOR, width=1)

    # 세로선
    for x in col_x:
        draw.line([x, table_top, x, table_top + row_height * 11],
                  fill=LINE_COLOR, width=1)

    # 외곽선 (굵게)
    draw.rectangle([col_x[0], table_top, col_x[-1], table_top + row_height * 11],
                   outline=HEADER_BG, width=3)

    # 푸터
    draw.text((WIDTH//2, HEIGHT - 50),
              "PoliticianFinder | AI 기반 정치인 종합 평가 시스템",
              fill=GRAY, font=font_footer, anchor="mm")
    draw.text((WIDTH//2, HEIGHT - 22),
              "2025-11-26 기준 | politicianfinder.ai.kr",
              fill=GRAY, font=font_footer, anchor="mm")

    # 저장
    output_path = os.path.join(OUTPUT_DIR, filename)
    img.save(output_path, quality=95)
    print(f"[OK] {filename}")
    return output_path

def main():
    """메인 함수"""
    print("\n" + "="*60)
    print("정치인 평가 순위표 이미지 생성기")
    print("="*60 + "\n")

    # 디렉터리 확인
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"디렉터리 생성: {OUTPUT_DIR}\n")

    # 이미지 생성
    results = []
    for title, candidates in DATA.items():
        filename = f"30명_순위표_{title}.png"
        path = create_ranking_image(title, candidates, filename)
        results.append(path)

    # 완료
    print("\n" + "="*60)
    print("[DONE] Image generation complete!")
    print("="*60)
    print(f"\n생성된 파일 ({len(results)}개):")
    for path in results:
        print(f"  - {os.path.basename(path)}")
    print(f"\n저장 위치: {OUTPUT_DIR}\n")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()
