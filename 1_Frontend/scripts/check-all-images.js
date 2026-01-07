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

async function checkAllImages() {
  // DiceBear 제외한 모든 이미지 URL 확인
  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('id, name, profile_image_url')
    .not('profile_image_url', 'ilike', '%dicebear%')
    .not('profile_image_url', 'is', null);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('DiceBear 외 이미지 URL 확인: ' + politicians.length + '개');
  console.log('');

  const invalidUrls = [];

  for (const p of politicians) {
    try {
      const response = await fetch(p.profile_image_url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const status = response.status;

      if (status === 200) {
        console.log('[OK ' + status + '] ' + p.name + ' - ' + p.profile_image_url.substring(0, 50));
      } else {
        console.log('[FAIL ' + status + '] ' + p.name + ' - ' + p.profile_image_url.substring(0, 50));
        invalidUrls.push(p);
      }
    } catch (err) {
      console.log('[ERROR] ' + p.name + ' - ' + err.message.substring(0, 30));
      invalidUrls.push(p);
    }
  }

  console.log('');
  console.log('유효하지 않은 URL: ' + invalidUrls.length + '개');

  if (invalidUrls.length > 0) {
    console.log('');
    console.log('=== 404 이미지 DiceBear로 교체 ===');
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
        console.log('[UPDATE FAIL] ' + p.name);
      } else {
        console.log('[UPDATED] ' + p.name);
      }
    }
  }

  console.log('');
  console.log('완료!');
}

checkAllImages();
