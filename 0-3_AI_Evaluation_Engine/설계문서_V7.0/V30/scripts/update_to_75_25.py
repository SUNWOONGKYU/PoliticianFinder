# -*- coding: utf-8 -*-
"""
V30 문서 일괄 업데이트: 95-5 → 75-25 구조 변경
- 수집: Gemini 75% + Perplexity 25%
- 평가: Claude, ChatGPT, Gemini, Grok (4개, 변경 없음)
"""
import os
import sys
import re

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def update_collect_files(filepath):
    """수집 지침 파일 업데이트 (2_collect/)"""
    print(f"\n처리 중: {os.path.basename(filepath)}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ 파일 읽기 실패: {e}")
        return False

    # 이미 75-25로 업데이트되었는지 확인
    if "Gemini (75%)" in content or "Perplexity (25%)" in content:
        print(f"  ⏭️ 이미 75-25로 업데이트됨, 스킵")
        return True

    original_content = content

    # 1. AI별 수집량 테이블 업데이트
    table_pattern = r'\| AI \| 공식 \| 공개 \| 합계 \| 비율 \| 역할 \|.*?\| \*\*합계\*\* \| 50개 \| 50개 \| \*\*100개\*\* \| 100% \| \|'
    new_table = """| AI | 공식 | 공개 | 합계 | 비율 | 역할 |
|----|------|------|------|------|------|
| **Gemini** | 50개 | 25개 | **75개** | **75%** | 수집+평가 |
| **Perplexity** | - | 25개 | **25개** | **25%** | 수집만 |
| ~~Claude~~ | - | - | **0개** | **0%** | ⚠️ 평가만 |
| ~~ChatGPT~~ | - | - | **0개** | **0%** | ⚠️ 평가만 |
| ~~Grok~~ | - | - | **0개** | **0%** | ⚠️ 평가만 |
| **합계** | 50개 | 50개 | **100개** | 100% | |"""

    content = re.sub(table_pattern, new_table, content, flags=re.DOTALL)

    # 2. 수집 구조 다이어그램 업데이트
    diagram_pattern = r'┌─────────────────────────────────────────────────────────────┐\n│ 📋 공식 데이터.*?└─────────────────────────────────────────────────────────────┘'
    new_diagram = """┌─────────────────────────────────────────────────────────────┐
│ 📋 공식 데이터 (50개) - Gemini 단독 담당                   │
│    └── Gemini: 50개 (100%) - Google Search 무료 ✅         │
├─────────────────────────────────────────────────────────────┤
│ 📰 공개 데이터 (50개) - 2개 AI 분담                        │
│    ├── Gemini: 25개 (50%) - 뉴스, SNS, 위키, 블로그 등     │
│    └── Perplexity: 25개 (50%) - 뉴스/언론 전담            │
└─────────────────────────────────────────────────────────────┘

⚠️ Claude/ChatGPT/Grok: 수집 금지! 평가만 담당!
⚠️ Perplexity: 수집만! 평가 안 함!"""

    content = re.sub(diagram_pattern, new_diagram, content, flags=re.DOTALL)

    # 3. 체크리스트 업데이트
    checklist_pattern = r'- \[ \] Gemini \d+개.*?\n- \[ \] Perplexity.*?\n- \[ \] Grok.*?\n- \[ \] Claude.*?\n'
    new_checklist = """- [ ] Gemini 75개 (공식 50 + 공개 25)
- [ ] Perplexity 25개 (공개 25 - 뉴스/언론 전담)
- [ ] Claude 0개 (⚠️ 평가만 - 수집 금지!)
- [ ] ChatGPT 0개 (⚠️ 평가만 - 수집 금지!)
- [ ] Grok 0개 (⚠️ 평가만 - 수집 금지!)
"""

    content = re.sub(checklist_pattern, new_checklist, content)

    # 4. AI에게 지시사항 업데이트 (수집 AI)
    content = content.replace(
        '**📌 수집 AI에게 (Gemini, Grok):**',
        '**📌 수집 AI에게 (Gemini, Perplexity):**'
    )

    # 변경 확인
    if content == original_content:
        print(f"  ⚠️ 변경사항 없음 - 패턴 미일치")
        return False

    # 파일 쓰기
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ 완료 (수집 지침 업데이트)")
        return True
    except Exception as e:
        print(f"  ❌ 파일 쓰기 실패: {e}")
        return False


def update_evaluate_files(filepath):
    """평가 지침 파일 업데이트 (3_evaluate/)"""
    print(f"\n처리 중: {os.path.basename(filepath)}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ 파일 읽기 실패: {e}")
        return False

    # 이미 75-25로 업데이트되었는지 확인
    if "Gemini    수집: 75개" in content:
        print(f"  ⏭️ 이미 75-25로 업데이트됨, 스킵")
        return True

    original_content = content

    # 평가 대상 데이터 다이어그램 업데이트
    diagram_pattern = r'┌──────────────────────────────────────┐\n│ Gemini    수집: \d+개.*?│\n│ Grok.*?│\n├──────────────────────────────────────┤\n│ 풀링 합계: 100개.*?│\n│ ~~Perplexity~~: 제거.*?│\n└──────────────────────────────────────┘'

    new_diagram = """┌──────────────────────────────────────┐
│ Gemini       수집: 75개              │
│ Perplexity   수집: 25개              │
├──────────────────────────────────────┤
│ 풀링 합계: 100개                     │
│ ~~Grok~~: 수집 제거 (평가만)        │
└──────────────────────────────────────┘"""

    content = re.sub(diagram_pattern, new_diagram, content, flags=re.DOTALL)

    # 평가 AI 설명 - 변경 없음 (4개 평가 AI 유지)
    # Claude, ChatGPT, Gemini, Grok이 각각 100개 전체 데이터를 독립적으로 평가

    # 변경 확인
    if content == original_content:
        print(f"  ⚠️ 변경사항 없음 - 패턴 미일치")
        return False

    # 파일 쓰기
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ 완료 (평가 지침 업데이트)")
        return True
    except Exception as e:
        print(f"  ❌ 파일 쓰기 실패: {e}")
        return False


def update_readme(filepath):
    """README.md 업데이트"""
    print(f"\n처리 중: {os.path.basename(filepath)}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ 파일 읽기 실패: {e}")
        return False

    # 이미 75-25로 업데이트되었는지 확인
    if "Gemini (75%)" in content or "Perplexity (25%)" in content:
        print(f"  ⏭️ 이미 75-25로 업데이트됨, 스킵")
        return True

    original_content = content

    # 수집 섹션 업데이트
    content = content.replace(
        '- **2개 AI 분담**: Gemini (95%), Grok (5%)',
        '- **2개 AI 분담**: Gemini (75%), Perplexity (25%)'
    )

    content = content.replace(
        '- **Gemini (95%)**: 공식 50개 + 공개 45개',
        '- **Gemini (75%)**: OFFICIAL 50개 + PUBLIC 25개 (수집+평가 겸업)'
    )

    content = content.replace(
        '- **Grok (5%)**: 공개 5개',
        '- **Perplexity (25%)**: PUBLIC 25개 (수집만, 평가 안 함)'
    )

    # 변경 확인
    if content == original_content:
        print(f"  ⚠️ 변경사항 없음")
        return False

    # 파일 쓰기
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ 완료 (README 업데이트)")
        return True
    except Exception as e:
        print(f"  ❌ 파일 쓰기 실패: {e}")
        return False


def main():
    base_dir = os.path.join('..', 'instructions')

    print("="*60)
    print("V30 문서 일괄 업데이트: 95-5 → 75-25")
    print("="*60)

    success_count = 0
    total_count = 0

    # 1. 수집 지침 파일 (10개)
    print("\n[1/3] 수집 지침 파일 업데이트 (2_collect/)")
    collect_dir = os.path.join(base_dir, '2_collect')
    collect_files = [f'cat{i:02d}_{cat}.md' for i, cat in enumerate([
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
    ], 1)]

    for filename in collect_files:
        filepath = os.path.join(collect_dir, filename)
        total_count += 1
        if os.path.exists(filepath):
            if update_collect_files(filepath):
                success_count += 1
        else:
            print(f"\n처리 중: {filename}")
            print(f"  ❌ 파일이 존재하지 않음: {filepath}")

    # 2. 평가 지침 파일 (10개)
    print("\n[2/3] 평가 지침 파일 업데이트 (3_evaluate/)")
    evaluate_dir = os.path.join(base_dir, '3_evaluate')

    for filename in collect_files:  # 같은 파일명 사용
        filepath = os.path.join(evaluate_dir, filename)
        total_count += 1
        if os.path.exists(filepath):
            if update_evaluate_files(filepath):
                success_count += 1
        else:
            print(f"\n처리 중: {filename}")
            print(f"  ❌ 파일이 존재하지 않음: {filepath}")

    # 3. README.md
    print("\n[3/3] README.md 업데이트")
    readme_path = os.path.join(base_dir, 'README.md')
    total_count += 1
    if os.path.exists(readme_path):
        if update_readme(readme_path):
            success_count += 1
    else:
        print(f"  ❌ 파일이 존재하지 않음: {readme_path}")

    print("\n" + "="*60)
    print(f"완료: {success_count}/{total_count}개 파일 성공")
    print("="*60)

    if success_count == total_count:
        print("\n✅ 모든 파일이 성공적으로 업데이트되었습니다!")
        print("\n변경 내용:")
        print("  - 수집: Gemini 95% + Grok 5% → Gemini 75% + Perplexity 25%")
        print("  - 평가: Claude, ChatGPT, Gemini, Grok (4개, 변경 없음)")
    else:
        print(f"\n⚠️ {total_count - success_count}개 파일 실패")


if __name__ == "__main__":
    main()
