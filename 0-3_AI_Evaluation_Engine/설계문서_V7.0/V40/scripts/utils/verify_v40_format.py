#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 형식 검증 스크립트
- collected_data_id 필드 확인
- reasoning 필드 확인
- rating 형식 확인 (+4 ~ -4)
- score 값 확인 (rating × 2)
"""

import os
import sys
import json
import uuid as uuid_module

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

VALID_RATINGS = ['+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4']
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2, '0': 0,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

CATEGORIES = [
    'integrity', 'ethics', 'accountability', 'transparency',
    'communication', 'responsiveness', 'publicinterest'
]


def is_valid_uuid(uuid_string):
    """UUID 형식 검증"""
    try:
        uuid_module.UUID(str(uuid_string))
        return True
    except (ValueError, AttributeError):
        return False


def verify_file(file_path):
    """파일 형식 검증"""
    errors = []
    warnings = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 필수 필드 확인
        # batch_num은 개별 배치 파일에만 필요, 통합 파일은 불필요
        if 'batch_num' in data:
            # 개별 배치 파일
            required_fields = ['batch_num', 'politician_id', 'politician_name',
                              'category', 'evaluator_ai', 'evaluated_at', 'evaluations']
        else:
            # 통합 결과 파일
            required_fields = ['politician_id', 'politician_name',
                              'category', 'evaluator_ai', 'evaluated_at', 'evaluations']

        for field in required_fields:
            if field not in data:
                errors.append(f"필수 필드 누락: {field}")

        # evaluations 검증
        evaluations = data.get('evaluations', [])

        for i, ev in enumerate(evaluations, 1):
            # collected_data_id 확인 (V40 형식)
            if 'collected_data_id' not in ev:
                errors.append(f"[항목 {i}] 'collected_data_id' 필드 누락 (V40 필수)")
            elif not is_valid_uuid(ev['collected_data_id']):
                errors.append(f"[항목 {i}] 잘못된 UUID: {ev['collected_data_id']}")

            # reasoning 확인 (V40 형식)
            if 'reasoning' not in ev:
                errors.append(f"[항목 {i}] 'reasoning' 필드 누락 (V40 필수)")

            # rating 확인
            rating = ev.get('rating', '')
            if rating not in VALID_RATINGS:
                errors.append(f"[항목 {i}] 잘못된 rating: {rating} (허용: {', '.join(VALID_RATINGS)})")

            # score 확인
            score = ev.get('score', None)
            expected_score = RATING_TO_SCORE.get(rating, 0)
            if score != expected_score:
                errors.append(f"[항목 {i}] 점수 불일치: {score} (예상: {expected_score}, rating: {rating})")

            # V40 형식 위반 필드 확인
            if 'id' in ev:
                warnings.append(f"[항목 {i}] V40 형식 위반: 'id' 대신 'collected_data_id' 사용해야 함")
            if 'reason' in ev:
                warnings.append(f"[항목 {i}] V40 형식 위반: 'reason' 대신 'reasoning' 사용해야 함")

        return errors, warnings, len(evaluations)

    except Exception as e:
        return [f"파일 읽기 실패: {e}"], [], 0


def main():
    """전체 파일 검증"""
    print("="*80)
    print("V40 형식 검증 시작")
    print("="*80)

    total_files = 0
    total_errors = 0
    total_warnings = 0
    total_evaluations = 0

    # 통합 결과 파일 검증
    print("\n[통합 결과 파일 검증]")
    for category in CATEGORIES:
        file_path = os.path.join(SCRIPT_DIR, f"eval_{category}_result.json")

        if not os.path.exists(file_path):
            print(f"  ⚠️ {category}: 파일 없음")
            continue

        errors, warnings, eval_count = verify_file(file_path)
        total_files += 1
        total_errors += len(errors)
        total_warnings += len(warnings)
        total_evaluations += eval_count

        if errors:
            print(f"  ❌ {category}: {len(errors)}개 오류")
            for err in errors[:3]:  # 최대 3개만 표시
                print(f"     - {err}")
        elif warnings:
            print(f"  ⚠️ {category}: {len(warnings)}개 경고")
            for warn in warnings[:3]:
                print(f"     - {warn}")
        else:
            print(f"  ✅ {category}: 검증 통과 ({eval_count}개 평가)")

    # 배치 결과 파일 검증
    print("\n[배치 결과 파일 검증]")
    batch_files = 0
    batch_errors = 0
    batch_warnings = 0

    for category in CATEGORIES:
        for batch_num in range(1, 9):
            file_path = os.path.join(SCRIPT_DIR, f"{category}_batch_{batch_num:02d}_result.json")

            if not os.path.exists(file_path):
                continue

            errors, warnings, _ = verify_file(file_path)
            batch_files += 1
            batch_errors += len(errors)
            batch_warnings += len(warnings)

    print(f"  총 배치 파일: {batch_files}개")
    if batch_errors > 0:
        print(f"  ❌ 오류: {batch_errors}개")
    if batch_warnings > 0:
        print(f"  ⚠️ 경고: {batch_warnings}개")
    if batch_errors == 0 and batch_warnings == 0:
        print(f"  ✅ 모든 배치 파일 검증 통과")

    # 전체 요약
    print("\n" + "="*80)
    print("검증 결과 요약")
    print("="*80)
    print(f"  총 파일: {total_files + batch_files}개")
    print(f"  총 평가 항목: {total_evaluations}개")
    print(f"  총 오류: {total_errors + batch_errors}개")
    print(f"  총 경고: {total_warnings + batch_warnings}개")

    if total_errors + batch_errors == 0:
        print("\n✅ 모든 파일이 V40 형식을 올바르게 따릅니다!")
    else:
        print("\n❌ V40 형식 오류가 발견되었습니다. 수정이 필요합니다.")

    print("="*80)


if __name__ == "__main__":
    main()
