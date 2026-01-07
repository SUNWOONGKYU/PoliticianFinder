const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/\s/g, '')
);

function generateAvatarUrl(name) {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5,7c3aed,2563eb,0891b2&backgroundType=gradientLinear`;
}

async function checkAndUpdateImages() {
  // Wikipedia URL을 가진 정치인 조회
  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('id, name, party, profile_image_url')
    .ilike('profile_image_url', '%wikipedia%');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Wikipedia URL 정치인: ' + politicians.length + '명');
  console.log('URL 유효성 확인 중...\n');

  const invalidUrls = [];

  for (const p of politicians) {
    try {
      const response = await fetch(p.profile_image_url, { method: 'HEAD', redirect: 'follow' });
      const status = response.status;

      if (status === 200) {
        console.log('[OK] ' + p.name);
      } else {
        console.log('[FAIL ' + status + '] ' + p.name);
        invalidUrls.push(p);
      }
    } catch (err) {
      console.log('[ERROR] ' + p.name + ' - ' + err.message);
      invalidUrls.push(p);
    }
  }

  console.log('\n유효하지 않은 URL: ' + invalidUrls.length + '개');

  if (invalidUrls.length > 0) {
    console.log('\n404 이미지 업데이트 중...');
    for (const p of invalidUrls) {
      const newUrl = generateAvatarUrl(p.name);
      const { error: updateError } = await supabase
        .from('politicians')
        .update({
          profile_image_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);

      if (updateError) {
        console.log('[UPDATE FAIL] ' + p.name + ': ' + updateError.message);
      } else {
        console.log('[UPDATED] ' + p.name);
      }
    }
  }

  console.log('\n완료!');
}

checkAndUpdateImages();
