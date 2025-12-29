require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function registerEmail() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/politicians?id=eq.9dc9f3b4`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ email: 'wksun999@naver.com' })
    }
  );
  
  const result = await response.json();
  
  if (result.length > 0) {
    console.log('✅ 이메일 등록 완료');
    console.log('   이름:', result[0].name);
    console.log('   이메일:', result[0].email);
    console.log('   ID:', result[0].id);
  } else {
    console.log('오류:', JSON.stringify(result));
  }
}

registerEmail().catch(console.error);
