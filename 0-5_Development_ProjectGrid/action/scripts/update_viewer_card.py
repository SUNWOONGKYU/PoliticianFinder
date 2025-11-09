#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
뷰어 카드에 시작 시간 표시 추가
"""

import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
VIEWER_FILE = SCRIPT_DIR.parent.parent.parent / "project-grid" / "project_grid_최종통합뷰어_v4.html"

def update_viewer():
    """카드에 생성자, 소요시간, 시작시간 필드 추가"""

    print("="*70)
    print("뷰어 카드에 시작 시간 표시 추가")
    print("="*70)
    print()

    # HTML 파일 읽기
    with open(VIEWER_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 기존 패턴 찾기
    old_pattern = r'''                        <div class="attr-row">
                            <div class="attr-label">진도</div>
                            <div class="attr-value">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: \$\{progress\}%"></div>
                                </div>
                                <small>\$\{task\.진도\}</small>
                            </div>
                        </div>
                        <div class="attr-row">
                            <div class="attr-label">빌드결과</div>
                            <div class="attr-value">\$\{task\.빌드결과\}</div>
                        </div>'''

    # 새로운 패턴 (생성자, 소요시간, 시작시간 추가)
    new_pattern = '''                        <div class="attr-row">
                            <div class="attr-label">진도</div>
                            <div class="attr-value">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%"></div>
                                </div>
                                <small>${task.진도}</small>
                            </div>
                        </div>
                        <div class="attr-row">
                            <div class="attr-label">생성자</div>
                            <div class="attr-value">${task.생성자}</div>
                        </div>
                        <div class="attr-row">
                            <div class="attr-label">소요시간</div>
                            <div class="attr-value">${task.소요시간}</div>
                        </div>
                        <div class="attr-row">
                            <div class="attr-label">🕐 시작 시간</div>
                            <div class="attr-value"><strong style="color: #0066cc;">${task.수정이력}</strong></div>
                        </div>
                        <div class="attr-row">
                            <div class="attr-label">빌드결과</div>
                            <div class="attr-value">${task.빌드결과}</div>
                        </div>'''

    # 패턴 교체
    if re.search(old_pattern, content):
        content = re.sub(old_pattern, new_pattern, content)
        print("✓ 카드 레이아웃 업데이트 완료")
    else:
        print("⚠ 기존 패턴을 찾을 수 없습니다.")
        return False

    # 파일 저장
    with open(VIEWER_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ 파일 저장: {VIEWER_FILE}")
    print()
    print("="*70)
    print("완료! 뷰어를 새로고침하면 시작 시간이 표시됩니다.")
    print("="*70)

    return True

if __name__ == "__main__":
    update_viewer()
