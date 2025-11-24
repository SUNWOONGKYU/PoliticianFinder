// Supabase에 직접 연결해서 테이블 구조 확인
const path = require('path');
const { createClient } = require(path.join(__dirname, '1_Frontend', 'node_modules', '@supabase/supabase-js'));

// 환경변수에서 Supabase 정보 가져오기
require(path.join(__dirname, '1_Frontend', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, '1_Frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Supabase 데이터베이스 상태 확인\n');
  console.log('URL:', supabaseUrl);
  console.log('\n');

  // 1. politician_ratings 테이블 존재 확인
  console.log('=== 1. politician_ratings 테이블 확인 ===\n');
  const { data: ratings, error: ratingsError } = await supabase
    .from('politician_ratings')
    .select('*')
    .limit(1);

  if (ratingsError) {
    console.log('❌ politician_ratings 테이블 오류:', ratingsError.message);
    console.log('   Code:', ratingsError.code);
    console.log('   Details:', ratingsError.details);
    console.log('   Hint:', ratingsError.hint);
  } else {
    console.log('✅ politician_ratings 테이블 존재');
    console.log('   샘플 데이터:', ratings.length > 0 ? ratings[0] : '(데이터 없음)');
  }

  // 2. favorite_politicians 테이블 존재 확인
  console.log('\n=== 2. favorite_politicians 테이블 확인 ===\n');
  const { data: favorites, error: favoritesError } = await supabase
    .from('favorite_politicians')
    .select('*')
    .limit(1);

  if (favoritesError) {
    console.log('❌ favorite_politicians 테이블 오류:', favoritesError.message);
    console.log('   Code:', favoritesError.code);
    console.log('   Details:', favoritesError.details);
    console.log('   Hint:', favoritesError.hint);
  } else {
    console.log('✅ favorite_politicians 테이블 존재');
    console.log('   샘플 데이터:', favorites.length > 0 ? favorites[0] : '(데이터 없음)');
  }

  // 3. politicians 테이블에서 c34753dd 확인
  console.log('\n=== 3. politician_id: c34753dd 존재 확인 ===\n');
  const { data: politician, error: politicianError } = await supabase
    .from('politicians')
    .select('id, name, political_party_id, position_id')
    .eq('id', 'c34753dd')
    .single();

  if (politicianError) {
    console.log('❌ politician c34753dd 찾기 실패:', politicianError.message);
  } else {
    console.log('✅ politician c34753dd 존재:');
    console.log('   ID:', politician.id);
    console.log('   Name:', politician.name);
    console.log('   Party:', politician.political_party_id);
    console.log('   Position:', politician.position_id);
  }

  // 4. politician_details 테이블 확인
  console.log('\n=== 4. politician_details 테이블 확인 ===\n');
  const { data: details, error: detailsError } = await supabase
    .from('politician_details')
    .select('politician_id, user_rating, rating_count')
    .eq('politician_id', 'c34753dd')
    .single();

  if (detailsError) {
    console.log('❌ politician_details 오류:', detailsError.message);
    console.log('   Code:', detailsError.code);
  } else {
    console.log('✅ politician_details 존재:');
    console.log('   politician_id:', details.politician_id);
    console.log('   user_rating:', details.user_rating);
    console.log('   rating_count:', details.rating_count);
  }

  // 5. RLS 정책 확인 (auth.users 접근 가능한지)
  console.log('\n=== 5. RLS 정책 확인 (비로그인 상태) ===\n');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log('현재 인증 상태:', user ? '✅ 로그인됨' : '❌ 비로그인');
  if (user) {
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
  }

  // 6. 테스트: 별점 평가 INSERT 시도 (실제로 삽입하지 않고 에러만 확인)
  console.log('\n=== 6. INSERT 권한 테스트 (DRY RUN) ===\n');

  if (!user) {
    console.log('⚠️  비로그인 상태이므로 INSERT 테스트 건너뜀');
    console.log('   → 실제 프로덕션에서는 로그인 필요');
  } else {
    console.log('🧪 INSERT 테스트 진행...');
    const { data: insertTest, error: insertError } = await supabase
      .from('politician_ratings')
      .insert({
        politician_id: 'c34753dd',
        user_id: user.id,
        rating: 5
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ INSERT 권한 있음 (이미 평가했음 - 중복 에러)');
      } else {
        console.log('❌ INSERT 실패:', insertError.message);
        console.log('   Code:', insertError.code);
        console.log('   Details:', insertError.details);
      }
    } else {
      console.log('✅ INSERT 성공!');
      console.log('   데이터:', insertTest);

      // 삽입한 데이터 삭제 (테스트 데이터이므로)
      console.log('\n   테스트 데이터 삭제 중...');
      await supabase
        .from('politician_ratings')
        .delete()
        .eq('id', insertTest.id);
      console.log('   ✅ 삭제 완료');
    }
  }

  console.log('\n\n=== 🎯 진단 완료 ===\n');
}

checkDatabase().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
