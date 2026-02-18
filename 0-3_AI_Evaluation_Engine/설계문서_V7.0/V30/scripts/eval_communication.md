# V30 Claude 평가 작업 (Subscription Mode)

**정치인**: 김민석 (f9e00370)
**카테고리**: 소통능력 (communication)
**미평가 데이터**: 75개

---

## 🎯 작업 지시

당신(Claude Code)은 **subscription mode**로 이 평가를 수행합니다.
- ✅ API 비용 $0
- ✅ 현재 세션에서 직접 평가 생성

---

## 📋 정치인 정보

- **이름**: 김민석
- **신분**: 출마예정자
- **직책**: 광역단체장
- **정당**: 더불어민주당
- **지역**: 서울

⚠️ **중요**: 반드시 위 정보와 일치하는 "김민석"에 대해 평가하세요.

---

## 📊 등급 체계 (+4 ~ -4)

| 등급 | 판단 기준 | 점수 |
|------|-----------|------|
| +4 | 탁월함 - 해당 분야 모범 사례 | +8 |
| +3 | 우수함 - 긍정적 평가 | +6 |
| +2 | 양호함 - 기본 충족 | +4 |
| +1 | 보통 - 평균 수준 | +2 |
| -1 | 미흡함 - 개선 필요 | -2 |
| -2 | 부족함 - 문제 있음 | -4 |
| -3 | 매우 부족 - 심각한 문제 | -6 |
| -4 | 극히 부족 - 정치인 부적합 | -8 |

**평가 기준**:
- 긍정적 내용 (성과, 업적, 칭찬) → +4, +3, +2
- 경미한 긍정 (보통, 평범) → +1
- 부정적 내용 (논란, 비판, 문제) → -1, -2, -3, -4 (심각도에 따라)

---

## 📂 데이터 파일

평가할 데이터는 다음 파일에 있습니다:
```
eval_communication_data.json
```

이 파일을 읽고 각 항목에 대해 평가를 수행하세요.

---

## 📝 평가 수행 방법

1. **데이터 파일 읽기**:
   ```python
   import json
   with open('eval_communication_data.json', 'r', encoding='utf-8') as f:
       task_data = json.load(f)
   items = task_data['items']
   ```

2. **각 항목 평가**:
   - 제목, 내용, 출처, 날짜를 분석
   - 소통능력 관점에서 객관적 평가
   - +4 ~ -4 등급 부여
   - 1문장 근거 작성

3. **결과 JSON 생성**:
   ```json
   {
     "politician_id": "f9e00370",
     "politician_name": "김민석",
     "category": "communication",
     "evaluator_ai": "Claude",
     "evaluated_at": "2026-01-21T...",
     "evaluations": [
       {
         "collected_data_id": "UUID",
         "rating": "+4 또는 -2 등",
         "score": 8 또는 -4 등,
         "reasoning": "평가 근거 1문장"
       }
     ]
   }
   ```

4. **결과 파일 저장**:
   ```python
   output_file = 'eval_communication_result.json'
   with open(output_file, 'w', encoding='utf-8') as f:
       json.dump(result, f, ensure_ascii=False, indent=2)
   ```

---

## ✅ 체크리스트

- [ ] eval_communication_data.json 파일 읽기
- [ ] 75개 항목 모두 평가
- [ ] 각 항목에 +4~-4 등급 부여
- [ ] 평가 근거 1문장씩 작성
- [ ] 결과를 eval_communication_result.json에 저장
- [ ] 저장 완료 메시지 출력

---

## 🚀 실행 명령

평가 완료 후 다음 명령으로 DB에 저장:
```bash
python evaluate_claude_auto.py --politician_id=f9e00370 --politician_name=김민석 --category=communication --import_results=eval_communication_result.json
```

---

**작업 시작 시간**: 2026-01-21T23:22:08.015606
**예상 소요**: 약 8분 (배치당 30초)
