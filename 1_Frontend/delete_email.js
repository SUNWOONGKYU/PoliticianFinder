require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function deleteEmail() {
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
      body: JSON.stringify({ email: null })
    }
  );
  
  const result = await response.json();
  
  if (result.length > 0) {
    console.log('✅ 이메일 삭제 완료');
    console.log('   이름:', result[0].name);
    console.log('   이메일:', result[0].email || '(삭제됨)');
  } else {
    console.log('결과:', JSON.stringify(result));
  }
}

deleteEmail().catch(console.error);
