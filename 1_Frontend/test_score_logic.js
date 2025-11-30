// 점수 로직 검증 테스트
// API 코드에서 사용하는 로직과 동일한 방식으로 테스트

console.log('\n=== AI 점수 처리 로직 검증 ===\n');

// 실제 DB 데이터 시뮬레이션 (check_duplicate_scores.js 결과 참조)
const scores = [
  { politician_id: '266c6671', ai_name: 'ChatGPT', total_score: 801, grade_code: 'E' },
  { politician_id: '266c6671', ai_name: 'Claude', total_score: 829, grade_code: 'E' },
  { politician_id: '266c6671', ai_name: 'Grok', total_score: 758, grade_code: 'P' },

  { politician_id: '3ee57024', ai_name: 'ChatGPT', total_score: 759, grade_code: 'P' },
  { politician_id: '3ee57024', ai_name: 'Claude', total_score: 609, grade_code: 'S' },
  { politician_id: '3ee57024', ai_name: 'Grok', total_score: 760, grade_code: 'E' },
];

// API의 로직과 동일하게 처리
const scoresMap = {};

// 1단계: 점수 수집
scores.forEach((score) => {
  if (!scoresMap[score.politician_id]) {
    scoresMap[score.politician_id] = {
      claude_score: 0,
      chatgpt_score: 0,
      grok_score: 0,
      total_score: 0,
      grade: undefined,
      updated_at: new Date().toISOString()
    };
  }

  const politicianScores = scoresMap[score.politician_id];

  if (score.ai_name === "Claude") {
    politicianScores.claude_score = score.total_score;
    politicianScores.grade = score.grade_code;
  } else if (score.ai_name === "ChatGPT") {
    politicianScores.chatgpt_score = score.total_score;
  } else if (score.ai_name === "Grok") {
    politicianScores.grok_score = score.total_score;
  }
});

// 2단계: 평균 계산
Object.values(scoresMap).forEach((politicianScores) => {
  const validScores = [
    politicianScores.claude_score,
    politicianScores.chatgpt_score,
    politicianScores.grok_score
  ].filter(s => s > 0);

  if (validScores.length > 0) {
    politicianScores.total_score = Math.round(
      validScores.reduce((a, b) => a + b, 0) / validScores.length
    );
  }
});

// 결과 출력
console.log('정치인 ID: 266c6671 (염태영)');
const p1 = scoresMap['266c6671'];
console.log(`  Claude: ${p1.claude_score}`);
console.log(`  ChatGPT: ${p1.chatgpt_score}`);
console.log(`  Grok: ${p1.grok_score}`);
console.log(`  평균: ${p1.total_score}`);
console.log(`  계산: (${p1.claude_score} + ${p1.chatgpt_score} + ${p1.grok_score}) / 3 = ${Math.round((p1.claude_score + p1.chatgpt_score + p1.grok_score) / 3)}`);
console.log();

console.log('정치인 ID: 3ee57024 (이재성)');
const p2 = scoresMap['3ee57024'];
console.log(`  Claude: ${p2.claude_score}`);
console.log(`  ChatGPT: ${p2.chatgpt_score}`);
console.log(`  Grok: ${p2.grok_score}`);
console.log(`  평균: ${p2.total_score}`);
console.log(`  계산: (${p2.claude_score} + ${p2.chatgpt_score} + ${p2.grok_score}) / 3 = ${Math.round((p2.claude_score + p2.chatgpt_score + p2.grok_score) / 3)}`);
console.log();

// 검증
console.log('=== 검증 결과 ===');
if (p1.claude_score !== p1.chatgpt_score && p1.chatgpt_score !== p1.grok_score) {
  console.log('✅ 염태영: AI 점수가 서로 다름 (올바름)');
} else {
  console.log('❌ 염태영: AI 점수가 동일함 (문제 있음)');
}

if (p2.claude_score !== p2.chatgpt_score && p2.chatgpt_score !== p2.grok_score) {
  console.log('✅ 이재성: AI 점수가 서로 다름 (올바름)');
} else {
  console.log('❌ 이재성: AI 점수가 동일함 (문제 있음)');
}

console.log('\n=== 검증 완료 ===\n');
