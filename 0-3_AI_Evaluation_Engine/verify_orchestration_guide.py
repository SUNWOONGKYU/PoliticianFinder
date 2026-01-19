# -*- coding: utf-8 -*-
"""
V30 오케스트레이션 가이드 검증 스크립트

검증 항목:
1. V30 버전 표기
2. 기간 제한 (2022-01-14, 2024-01-14)
3. AI 역할 분담 (수집: Gemini 60%, Perplexity 30%, Grok 10% / 평가: Claude, ChatGPT, Gemini, Grok)
4. 등급 체계 (8단계: +4 ~ -4, 0 제외)
5. 수집량 (1,000개, 3,000개 아님)
6. 평가량 (4,000개)
7. 점수 계산 공식
8. 다른 V30 문서와의 일관성
"""

import os
import re

# 파일 경로
orchestration_file = "설계문서_V7.0/instructions_v30/V30_오케스트레이션_가이드.md"
eval_guideline_sample = "설계문서_V7.0/instructions_v30/3_evaluate/cat01_expertise.md"

print("=" * 80)
print("V30 오케스트레이션 가이드 검증")
print("=" * 80)

# 파일 읽기
with open(orchestration_file, 'r', encoding='utf-8') as f:
    orch_content = f.read()

with open(eval_guideline_sample, 'r', encoding='utf-8') as f:
    eval_content = f.read()

issues = []
warnings = []

# ============================================================================
# 검증 1: V30 버전 표기
# ============================================================================
print("\n[검증 1] V30 버전 표기")

if "V30" in orch_content:
    print("  OK - V30 표기 발견")
else:
    issues.append("V30 표기 누락")
    print("  FAIL - V30 표기 누락")

# 이전 버전 표기 확인
if re.search(r'V2[468]', orch_content):
    issues.append("이전 버전 표기 발견 (V24, V26, V28)")
    print("  FAIL - 이전 버전 표기 발견")

# ============================================================================
# 검증 2: 기간 제한
# ============================================================================
print("\n[검증 2] 기간 제한")

has_2022 = "2022-01-14" in orch_content
has_2024 = "2024-01-14" in orch_content

if has_2022 and has_2024:
    print("  OK - 올바른 기간 (2022-01-14, 2024-01-14)")
else:
    issues.append(f"기간 제한 오류 (2022-01-14: {has_2022}, 2024-01-14: {has_2024})")
    print(f"  FAIL - 기간 제한 오류")

# 잘못된 날짜 확인
if re.search(r'2022-01-07|2024-01-11', orch_content):
    issues.append("잘못된 날짜 발견")
    print("  FAIL - 잘못된 날짜 발견")

# ============================================================================
# 검증 3: AI 역할 분담
# ============================================================================
print("\n[검증 3] AI 역할 분담")

# 수집 AI (Gemini 60%, Perplexity 30%, Grok 10%)
collection_pattern = r'Gemini.*60%.*Perplexity.*30%.*Grok.*10%'
if re.search(collection_pattern, orch_content, re.DOTALL):
    print("  OK - 수집 AI 분담 (60-30-10)")
else:
    issues.append("수집 AI 분담 오류")
    print("  FAIL - 수집 AI 분담 오류")

# Claude/ChatGPT 수집 제외 확인
if re.search(r'Claude.*수집.*제외|ChatGPT.*수집.*제외', orch_content, re.DOTALL):
    print("  OK - Claude/ChatGPT 수집 제외 명시")
else:
    warnings.append("Claude/ChatGPT 수집 제외 명시 부족")
    print("  WARN - Claude/ChatGPT 수집 제외 명시 부족")

# 평가 AI (Claude, ChatGPT, Gemini, Grok)
eval_ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']
eval_ai_found = all(ai in orch_content for ai in eval_ais)

if eval_ai_found:
    print("  OK - 평가 AI 4개 (Claude, ChatGPT, Gemini, Grok)")
else:
    issues.append("평가 AI 목록 불완전")
    print("  FAIL - 평가 AI 목록 불완전")

# Perplexity 평가 제외 확인
if re.search(r'Perplexity.*평가.*제외', orch_content, re.DOTALL):
    print("  OK - Perplexity 평가 제외 명시")
else:
    warnings.append("Perplexity 평가 제외 명시 부족")
    print("  WARN - Perplexity 평가 제외 명시 부족")

# ============================================================================
# 검증 4: 등급 체계 (9단계, 0 포함)
# ============================================================================
print("\n[검증 4] 등급 체계")

# 평가 지침서의 등급 체계 확인
eval_ratings = re.findall(r'\*\*([+-]?\d+)\*\*', eval_content)
eval_ratings_unique = sorted(set(eval_ratings), key=lambda x: int(x))

print(f"  평가 지침서 등급: {eval_ratings_unique}")

# 오케스트레이션 가이드의 등급 체계 확인
if re.search(r'\b0:\s*중립', orch_content):
    print("  OK - 등급 체계에 0(중립) 포함 (9단계)")
else:
    issues.append("등급 체계에 0(중립) 누락 - V30은 9단계(+4~+1, 0, -1~-4) 사용")
    print("  FAIL - 등급 체계에 0(중립) 누락됨")
    print("         V30은 9단계 사용: +4, +3, +2, +1, 0, -1, -2, -3, -4")

# +4 ~ -4 범위 확인
if re.search(r'\+4.*-4', orch_content, re.DOTALL):
    print("  OK - +4 ~ -4 범위 명시")
else:
    warnings.append("+4 ~ -4 범위 명시 부족")
    print("  WARN - +4 ~ -4 범위 명시 부족")

# ============================================================================
# 검증 5: 수집량 (1,000개)
# ============================================================================
print("\n[검증 5] 수집량")

# 1,000개 수집 확인
if re.search(r'1,?000개.*수집', orch_content):
    print("  OK - 총 수집량 1,000개 명시")
else:
    issues.append("총 수집량 1,000개 명시 부족")
    print("  FAIL - 총 수집량 1,000개 명시 부족")

# 3,000개 잘못된 표기 확인 (맥락 고려 - 개선)
# "잘못된 이해", "잘못된 계산", "피해야 할 실수" 섹션에서는 OK
# 섹션 제목과 함께 체크
lines = orch_content.split('\n')
problematic_3000 = []
in_error_section = False

for i, line in enumerate(lines):
    # 섹션 시작 체크 (잘못된 예시/실수 섹션)
    if re.search(r'##.*잘못된|##.*흔한 오해|##.*피해야 할 실수|실수 \d+:', line):
        in_error_section = True
    # 새로운 주요 섹션 시작 (## 제목)
    elif re.match(r'^## [^#]', line) and not re.search(r'잘못된|오해|실수', line):
        in_error_section = False

    # 3,000개 표기 발견
    if re.search(r'3,?000개', line):
        # 에러 섹션이 아니고, 체크리스트도 아니면 문제
        if not in_error_section and '아님!' not in line and '[ ]' not in line:
            problematic_3000.append(f"라인 {i+1}: {line.strip()}")

if problematic_3000:
    issues.append("잘못된 수집량 3,000개 표기 발견 (맥락 없음)")
    print("  FAIL - 잘못된 수집량 3,000개 표기 발견 (맥락 없음)")
    for p in problematic_3000[:3]:  # 최대 3개만 표시
        print(f"        {p}")
else:
    print("  OK - 3,000개 표기는 모두 '잘못된 예시' 맥락에 있음")

# 카테고리당 100개 확인
if re.search(r'카테고리당\s*100개', orch_content):
    print("  OK - 카테고리당 100개 명시")
else:
    warnings.append("카테고리당 100개 명시 부족")
    print("  WARN - 카테고리당 100개 명시 부족")

# ============================================================================
# 검증 6: 평가량 (4,000개)
# ============================================================================
print("\n[검증 6] 평가량")

# 4,000개 평가 확인
if re.search(r'4,?000개.*평가', orch_content):
    print("  OK - 총 평가량 4,000개 명시")
else:
    issues.append("총 평가량 4,000개 명시 부족")
    print("  FAIL - 총 평가량 4,000개 명시 부족")

# 잘못된 10,000개 표기 확인
if re.search(r'10,?000개', orch_content):
    # 맥락 확인
    context_match = re.search(r'총\s*평가량.*10,?000개', orch_content)
    if context_match:
        issues.append("잘못된 평가량 10,000개 표기 발견 (라인 14)")
        print("  FAIL - 잘못된 평가량 10,000개 표기 발견")
        print("         올바른 값: 4,000개 (4개 AI × 1,000개)")

# ============================================================================
# 검증 7: 점수 계산 공식
# ============================================================================
print("\n[검증 7] 점수 계산 공식")

# PRIOR, COEFFICIENT 확인
if re.search(r'PRIOR\s*=\s*6\.0', orch_content):
    print("  OK - PRIOR = 6.0")
else:
    warnings.append("PRIOR 값 확인 필요")
    print("  WARN - PRIOR 값 확인 필요")

if re.search(r'COEFFICIENT\s*=\s*0\.5', orch_content):
    print("  OK - COEFFICIENT = 0.5")
else:
    warnings.append("COEFFICIENT 값 확인 필요")
    print("  WARN - COEFFICIENT 값 확인 필요")

# 공식 확인
if re.search(r'\(6\.0\s*\+\s*avg_rating\s*\*\s*0\.5\)\s*\*\s*10', orch_content):
    print("  OK - 점수 공식: (6.0 + avg_rating * 0.5) * 10")
else:
    warnings.append("점수 계산 공식 확인 필요")
    print("  WARN - 점수 계산 공식 확인 필요")

# ============================================================================
# 검증 8: politician_id 타입
# ============================================================================
print("\n[검증 8] politician_id 타입")

# TEXT 타입 명시 확인
if re.search(r'politician_id.*TEXT|8자리.*hex', orch_content, re.IGNORECASE):
    print("  OK - politician_id TEXT 타입 명시")
else:
    warnings.append("politician_id TEXT 타입 명시 부족")
    print("  WARN - politician_id TEXT 타입 명시 부족")

# parseInt 금지 확인
if re.search(r'parseInt.*금지', orch_content):
    print("  OK - parseInt() 금지 명시")
else:
    warnings.append("parseInt() 금지 명시 부족")
    print("  WARN - parseInt() 금지 명시 부족")

# ============================================================================
# 최종 결과
# ============================================================================
print("\n" + "=" * 80)
print("검증 결과 요약")
print("=" * 80)

if not issues and not warnings:
    print("\n[PASS] 모든 검증 통과!")
    print("\n오케스트레이션 가이드가 V30 시스템과 완벽히 일치합니다.")
elif not issues and warnings:
    print("\n[PASS with WARNINGS] 주요 검증 통과, 경고 사항 있음")
    print(f"\n경고 사항 ({len(warnings)}개):")
    for i, w in enumerate(warnings, 1):
        print(f"  {i}. {w}")
else:
    print("\n[FAIL] 검증 실패")
    print(f"\n문제 발견 ({len(issues)}개):")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")

    if warnings:
        print(f"\n경고 사항 ({len(warnings)}개):")
        for i, w in enumerate(warnings, 1):
            print(f"  {i}. {w}")

print("\n" + "=" * 80)

# 종료 코드
exit_code = 0 if not issues else 1
exit(exit_code)
