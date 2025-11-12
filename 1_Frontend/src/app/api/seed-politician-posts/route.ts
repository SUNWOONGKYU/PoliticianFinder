// Temporary API to seed politician posts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function seedPosts() {
  const supabase = createClient();

  // Get first 3 politicians
  const { data: politicians, error: politiciansError } = await supabase
    .from('politicians')
    .select('id, name')
    .limit(3);

  if (politiciansError || !politicians || politicians.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No politicians found' },
      { status: 404 }
    );
  }

  // Create posts for each politician
  const posts = politicians.map((pol, index) => ({
    title: index === 0 ? '청년 일자리 공약 실행 계획' :
           index === 1 ? '교육 개혁 추진 현황' :
           '의료 접근성 개선 방안',
    content: index === 0 ? '구체적인 청년 일자리 창출 방안을 발표합니다. 청년 고용을 위한 예산 확대와 기업 인센티브 제공을 추진하겠습니다.' :
             index === 1 ? '교육 시스템 개선을 위한 법안을 준비하고 있습니다. 공교육 강화와 사교육 부담 완화를 목표로 합니다.' :
             '지역 의료 격차 해소를 위한 정책을 제안합니다. 지방 의료 인프라 확충과 의료비 지원을 확대하겠습니다.',
    category: 'general',
    user_id: '7f61567b-bbdf-427a-90a9-0ee060ef4595',
    politician_id: pol.id,
    view_count: 150 + index * 50,
    like_count: 25 + index * 5,
    comment_count: 8 + index * 4,
  }));

  const { data: insertedPosts, error: insertError } = await supabase
    .from('posts')
    .insert(posts)
    .select();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Created ${insertedPosts.length} politician posts`,
    posts: insertedPosts,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await seedPosts();
  } catch (error) {
    console.error('Seed politician posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await seedPosts();
  } catch (error) {
    console.error('Seed politician posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
