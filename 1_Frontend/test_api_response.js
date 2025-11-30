// API 응답 확인
const fetch = require('node-fetch');

async function testAPI() {
  console.log('\n=== API 응답 확인 ===\n');
  
  const response = await fetch('http://localhost:3000/api/politicians?limit=3&page=1');
  const data = await response.json();
  
  if (data.success && data.data) {
    data.data.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.name}:`);
      console.log(`   totalScore: ${p.totalScore}`);
      console.log(`   claude: ${p.claude}`);
      console.log(`   chatgpt: ${p.chatgpt}`);
      console.log(`   grok: ${p.grok}`);
      console.log(`   claudeScore: ${p.claudeScore}`);
    });
  }
  
  console.log('\n=== 확인 완료 ===\n');
}

testAPI().catch(console.error);
