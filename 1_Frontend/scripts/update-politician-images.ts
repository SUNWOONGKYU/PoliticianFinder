/**
 * 정치인 프로필 이미지 업데이트 스크립트
 *
 * 사용법:
 * 1. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 설정
 * 2. npx tsx scripts/update-politician-images.ts
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수 로드
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '미설정');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '미설정');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 정치인별 실제 이미지 URL 매핑 (공개된 출처)
const POLITICIAN_IMAGE_MAP: Record<string, string> = {
  // 국회의원 공식 사이트 이미지 또는 공개된 이미지
  // ID: URL 형식으로 추가
};

// DiceBear 아바타 URL 생성 (이름 기반)
function generateAvatarUrl(name: string, id: string): string {
  // DiceBear의 initials 스타일 사용 (이니셜 기반 아바타)
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4f46e5,7c3aed,2563eb,0891b2&backgroundType=gradientLinear`;
}

// UI Avatars 백업 (DiceBear 대체)
function generateUIAvatarUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=4f46e5&color=ffffff&size=200&bold=true`;
}

async function updatePoliticianImages() {
  console.log('🚀 정치인 프로필 이미지 업데이트 시작...\n');

  // 모든 정치인 조회
  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('id, name, party, position, profile_image_url')
    .order('name', { ascending: true });

  if (error) {
    console.error('정치인 목록 조회 실패:', error);
    process.exit(1);
  }

  if (!politicians || politicians.length === 0) {
    console.log('업데이트할 정치인이 없습니다.');
    return;
  }

  console.log(`총 ${politicians.length}명의 정치인 발견\n`);

  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const politician of politicians) {
    // 먼저 매핑된 이미지 확인
    let newImageUrl = POLITICIAN_IMAGE_MAP[politician.id];

    if (!newImageUrl) {
      // 매핑이 없으면 아바타 생성
      newImageUrl = generateAvatarUrl(politician.name, politician.id);
    }

    // 현재 이미지가 유효한지 확인 (null, placeholder, wikipedia 404 등)
    const currentUrl = politician.profile_image_url;
    const needsUpdate = !currentUrl ||
      currentUrl.includes('placeholder') ||
      currentUrl.includes('default') ||
      currentUrl.includes('wikipedia.org') ||  // Wikipedia 이미지는 404 반환하므로 교체
      currentUrl.trim() === '';

    if (!needsUpdate) {
      console.log(`⏭️  ${politician.name} - 이미지 있음, 건너뜀`);
      skipCount++;
      continue;
    }

    // 이미지 업데이트
    const { error: updateError } = await supabase
      .from('politicians')
      .update({
        profile_image_url: newImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', politician.id);

    if (updateError) {
      console.error(`❌ ${politician.name} 업데이트 실패:`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ ${politician.name} (${politician.party}) - 이미지 업데이트 완료`);
      updateCount++;
    }
  }

  console.log('\n📊 업데이트 결과:');
  console.log(`   ✅ 성공: ${updateCount}명`);
  console.log(`   ⏭️  건너뜀: ${skipCount}명`);
  console.log(`   ❌ 실패: ${errorCount}명`);
  console.log(`   📋 총: ${politicians.length}명\n`);
}

// 스크립트 실행
updatePoliticianImages().catch(console.error);
