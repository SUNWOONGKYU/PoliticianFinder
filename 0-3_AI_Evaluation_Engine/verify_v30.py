#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 문서 일관성 자동 검증 스크립트"""

import re
import os
import sys

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

categories = [
    ("cat01_expertise.md", 1, "전문성"),
    ("cat02_leadership.md", 2, "리더십"),
    ("cat03_vision.md", 3, "비전"),
    ("cat04_integrity.md", 4, "청렴성"),
    ("cat05_ethics.md", 5, "윤리성"),
    ("cat06_accountability.md", 6, "책임감"),
    ("cat07_transparency.md", 7, "투명성"),
    ("cat08_communication.md", 8, "소통능력"),
    ("cat09_responsiveness.md", 9, "대응성"),
    ("cat10_publicinterest.md", 10, "공익성")
]

base_path = "C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/instructions_v30"
collect_base = f"{base_path}/2_collect/"
eval_base = f"{base_path}/3_evaluate/"

print("=" * 80)
print("V30 문서 일관성 자동 검증")
print("=" * 80)

# 검증 1: 10개 항목 일치
print("\n[검증 1] 수집-평가 10개 항목 일치")
success_count = 0
item_details = []

for filename, cat_num, kor_name in categories:
    collect_path = os.path.join(collect_base, filename)
    eval_path = os.path.join(eval_base, filename)

    try:
        with open(collect_path, 'r', encoding='utf-8') as f:
            collect_content = f.read()
            collect_items = re.findall(r'\| (\d+-\d+) \| \*\*(.*?)\*\* \|', collect_content)

        with open(eval_path, 'r', encoding='utf-8') as f:
            eval_content = f.read()
            eval_items = re.findall(r'\| (\d+-\d+) \| \*\*(.*?)\*\* \|', eval_content)

        if collect_items == eval_items and len(collect_items) == 10:
            print(f"  ✅ {kor_name}: {len(collect_items)}개 항목 일치")
            success_count += 1
        else:
            print(f"  ❌ {kor_name}: 불일치! (수집: {len(collect_items)}개, 평가: {len(eval_items)}개)")
            # 차이점 상세 출력
            for i in range(max(len(collect_items), len(eval_items))):
                c_item = collect_items[i] if i < len(collect_items) else ("없음", "없음")
                e_item = eval_items[i] if i < len(eval_items) else ("없음", "없음")
                if c_item != e_item:
                    print(f"     차이 {i+1}: 수집={c_item}, 평가={e_item}")
    except Exception as e:
        print(f"  ❌ {kor_name}: 파일 읽기 오류 - {e}")

print(f"\n결과: {success_count}/10 통과")

# 검증 2: V30 표기
print("\n[검증 2] V30 버전 표기")
v30_count = 0
old_version_files = []

for filename, cat_num, kor_name in categories:
    for base, base_name in [(collect_base, "수집"), (eval_base, "평가")]:
        path = os.path.join(base, filename)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if "V30" in content:
                    v30_count += 1
                # 이전 버전 확인
                if re.search(r'V28|V26|V24', content):
                    old_version_files.append(f"{kor_name} ({base_name})")
        except Exception as e:
            print(f"  ❌ {kor_name} ({base_name}): 읽기 오류 - {e}")

print(f"결과: {v30_count}/20 파일이 V30 사용")
if old_version_files:
    print(f"⚠️  이전 버전 표기 발견: {', '.join(old_version_files)}")

# 검증 3: 기간 제한
print("\n[검증 3] 기간 제한 일관성")
date_count = 0
wrong_dates = []

for filename, cat_num, kor_name in categories:
    for base, base_name in [(collect_base, "수집"), (eval_base, "평가")]:
        path = os.path.join(base, filename)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                has_2022 = "2022-01-14" in content
                has_2024 = "2024-01-14" in content

                if has_2022 and has_2024:
                    date_count += 1
                else:
                    wrong_dates.append(f"{kor_name} ({base_name})")
        except Exception as e:
            print(f"  ❌ {kor_name} ({base_name}): 읽기 오류 - {e}")

print(f"결과: {date_count}/20 파일이 올바른 기간 사용")
if wrong_dates:
    print(f"⚠️  잘못된 날짜 사용: {', '.join(wrong_dates)}")

# 검증 4: AI 역할 분담
print("\n[검증 4] AI 역할 분담 일관성")
ai_role_ok = True
ai_issues = []

for filename, cat_num, kor_name in categories:
    # 수집 지침서: Gemini, Perplexity, Grok만
    collect_path = os.path.join(collect_base, filename)
    try:
        with open(collect_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if "Claude" in content or "ChatGPT" in content:
                ai_issues.append(f"{kor_name} 수집: Claude/ChatGPT 언급됨")
                ai_role_ok = False
    except:
        pass

    # 평가 지침서: Claude, ChatGPT, Gemini, Grok만 (Perplexity 제외)
    eval_path = os.path.join(eval_base, filename)
    try:
        with open(eval_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if "Perplexity" in content:
                ai_issues.append(f"{kor_name} 평가: Perplexity 언급됨")
                ai_role_ok = False
    except:
        pass

if ai_role_ok:
    print("결과: ✅ AI 역할 분담 일관성 유지")
else:
    print("결과: ❌ AI 역할 분담 문제 발견")
    for issue in ai_issues:
        print(f"  - {issue}")

# 검증 5: 구조 일관성
print("\n[검증 5] 구조 일관성")
print("(수동 확인 권장 - 샘플 파일로 구조 검증)")

# 샘플로 전문성 파일의 섹션 구조 확인
collect_sample = os.path.join(collect_base, "cat01_expertise.md")
eval_sample = os.path.join(eval_base, "cat01_expertise.md")

try:
    with open(collect_sample, 'r', encoding='utf-8') as f:
        collect_headers = re.findall(r'^## (.+)$', f.read(), re.MULTILINE)

    with open(eval_sample, 'r', encoding='utf-8') as f:
        eval_headers = re.findall(r'^## (.+)$', f.read(), re.MULTILINE)

    print(f"\n수집 지침서 섹션 수: {len(collect_headers)}개")
    for i, h in enumerate(collect_headers, 1):
        print(f"  {i}. {h}")

    print(f"\n평가 지침서 섹션 수: {len(eval_headers)}개")
    for i, h in enumerate(eval_headers, 1):
        print(f"  {i}. {h}")
except Exception as e:
    print(f"❌ 구조 확인 오류: {e}")

# 최종 결과
print("\n" + "=" * 80)
print("최종 검증 결과")
print("=" * 80)

all_pass = (success_count == 10 and
            v30_count == 20 and
            date_count == 20 and
            ai_role_ok and
            len(old_version_files) == 0)

if all_pass:
    print("✅ 모든 검증 통과!")
    print("   V30 시스템 사용 가능")
else:
    print("⚠️  일부 검증 실패")
    print(f"  - 항목 일치: {success_count}/10")
    print(f"  - V30 표기: {v30_count}/20")
    print(f"  - 기간 일치: {date_count}/20")
    print(f"  - AI 역할: {'✅' if ai_role_ok else '❌'}")
    print(f"  - 이전 버전 표기: {'없음' if len(old_version_files) == 0 else '있음'}")

print("=" * 80)
