#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
뷰어 카드에 시작 시간 표시 추가
"""

from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
VIEWER_FILE = SCRIPT_DIR.parent.parent.parent / "project-grid" / "project_grid_최종통합뷰어_v4.html"

def update_viewer():
    """카드에 생성자, 소요시간, 시작시간 필드 추가"""

    # HTML 파일 읽기
    with open(VIEWER_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 수정할 부분 찾기 및 교체
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)

        # "진도" 다음에 "빌드결과"가 바로 오는 패턴 찾기
        if '진도</div>' in line:
            # 다음 몇 줄 확인
            j = i + 1
            found_build = False
            while j < len(lines) and j < i + 10:
                if '빌드결과</div>' in lines[j]:
                    found_build = True
                    break
                j += 1

            if found_build:
                # "진도" 섹션 다음에 생성자/소요시간/시작시간 추가
                # 먼저 "진도" 섹션의 닫기 태그까지 복사
                k = i + 1
                while k <= j:
                    if '</div>' in lines[k] and 'attr-row' not in lines[k-1]:
                        # 진도 섹션의 마지막 </div>
                        new_lines.append(lines[k])
                        k += 1
                        break
                    new_lines.append(lines[k])
                    k += 1

                # 이제 빌드결과 섹션 전에 3개 필드 삽입
                indent = '                        '
                new_lines.append(f'{indent}<div class="attr-row">\n')
                new_lines.append(f'{indent}    <div class="attr-label">생성자</div>\n')
                new_lines.append(f'{indent}    <div class="attr-value">${{task.생성자}}</div>\n')
                new_lines.append(f'{indent}</div>\n')

                new_lines.append(f'{indent}<div class="attr-row">\n')
                new_lines.append(f'{indent}    <div class="attr-label">소요시간</div>\n')
                new_lines.append(f'{indent}    <div class="attr-value">${{task.소요시간}}</div>\n')
                new_lines.append(f'{indent}</div>\n')

                new_lines.append(f'{indent}<div class="attr-row">\n')
                new_lines.append(f'{indent}    <div class="attr-label">시작 시간</div>\n')
                new_lines.append(f'{indent}    <div class="attr-value"><strong style="color: #0066cc;">${{task.수정이력}}</strong></div>\n')
                new_lines.append(f'{indent}</div>\n')

                # 나머지 라인 계속
                i = k - 1

        i += 1

    # 파일 저장
    with open(VIEWER_FILE, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    return True

if __name__ == "__main__":
    update_viewer()
    print("Done")
