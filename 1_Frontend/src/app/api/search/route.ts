// 통합 검색 API - 정치인 + 게시글 검색
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapPoliticianListFields } from '@/utils/fieldMapper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, politicians, posts
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '검색어는 최소 2자 이상 입력해주세요.',
      }, { status: 400 });
    }

    const supabase = await createClient();
    const results: any = {
      politicians: [],
      posts: [],
    };

    // 정치인 검색
    if (type === 'all' || type === 'politicians') {
      const { data: politicians, error: politiciansError } = await supabase
        .from('politicians')
        .select('id, name, party, position, region, district, profile_image_url, updated_at')
        .or(`name.ilike.%${query}%,party.ilike.%${query}%,region.ilike.%${query}%,district.ilike.%${query}%`)
        .limit(limit)
        .order('name');

      if (!politiciansError && politicians) {
        // V24.0 AI 점수 조회
        const politicianIds = politicians.map((p: any) => p.id);

        if (politicianIds.length > 0) {
          const { data: scores } = await supabase
            .from('ai_final_scores')
            .select('politician_id, total_score')
            .in('politician_id', politicianIds);

          const scoresMap: Record<string, number> = {};
          if (scores) {
            scores.forEach((score: any) => {
              scoresMap[score.politician_id] = score.total_score;
            });
          }

          results.politicians = politicians.map((p: any) =>
            mapPoliticianListFields({
              ...p,
              ai_score: scoresMap[p.id] || 0,
            })
          );
        }
      }
    }

    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          category,
          user_id,
          politician_id,
          view_count,
          upvotes,
          downvotes,
          comment_count,
          created_at,
          profiles(username),
          politicians(name, party, position)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (!postsError && posts) {
        results.posts = posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.politician_id ? 'politician_post' : 'general',
          author_name: post.politician_id
            ? post.politicians?.name || '정치인'
            : post.profiles?.username || '익명',
          author_type: post.politician_id ? 'politician' : 'user',
          politician_name: post.politicians?.name,
          politician_party: post.politicians?.party,
          politician_position: post.politicians?.position,
          view_count: post.view_count || 0,
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          comment_count: post.comment_count || 0,
          created_at: post.created_at,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      query: query,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({
      success: false,
      error: '검색 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
