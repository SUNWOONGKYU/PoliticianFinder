// Home API Service
// 메인 페이지 데이터 fetch

import { supabase } from '@/lib/supabase';

export interface PoliticianRanking {
  id: number;
  name: string;
  party: string;
  region: string;
  position: string;
  status: string;
  profile_image_url?: string;
  claude_score?: number;
  gpt_score?: number;
  gemini_score?: number;
  grok_score?: number;
  perplexity_score?: number;
  composite_score?: number;
  member_rating: number;
  member_rating_count: number;
}

export interface HotPost {
  id: number;
  title: string;
  content: string;
  category: string;
  view_count: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  hot_score: number;
  is_hot: boolean;
  created_at: string;
  author_username: string;
  author_avatar?: string;
}

export interface PoliticianPost {
  id: number;
  politician_id: number;
  politician_name: string;
  politician_party: string;
  politician_position: string;
  politician_status: string;
  politician_avatar?: string;
  category: string;
  title?: string;
  content: string;
  view_count: number;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

export interface HomeData {
  aiRanking: PoliticianRanking[];
  hotPosts: HotPost[];
  politicianPosts: PoliticianPost[];
  sidebar: any;
}

/**
 * 메인 페이지 전체 데이터 조회
 */
export async function getHomeData(): Promise<HomeData> {
  try {
    // AI 평점 랭킹 TOP 10 (뷰가 없으면 빈 배열)
    const { data: aiRanking, error: rankingError } = await supabase
      .from('v_ai_ranking_top10')
      .select('*');

    // 뷰가 없어도 계속 진행
    if (rankingError) {
      console.warn('v_ai_ranking_top10 view not found:', rankingError);
    }

    // 실시간 인기글 TOP 15
    const { data: hotPosts, error: hotPostsError } = await supabase
      .from('v_hot_posts_top15')
      .select('*');

    if (hotPostsError) {
      console.warn('v_hot_posts_top15 view not found:', hotPostsError);
    }

    // 정치인 최근 글 9개
    const { data: politicianPosts, error: politicianPostsError } = await supabase
      .from('v_politician_posts_recent9')
      .select('*');

    if (politicianPostsError) {
      console.warn('v_politician_posts_recent9 view not found:', politicianPostsError);
    }

    // 사이드바 데이터
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sidebarData, error: sidebarError } = await supabase
      .rpc('get_sidebar_data', { p_user_id: user?.id || null });

    if (sidebarError) {
      console.warn('get_sidebar_data RPC not found:', sidebarError);
    }

    // 모든 데이터가 비어있어도 빈 배열로 반환
    return {
      aiRanking: aiRanking || [],
      hotPosts: hotPosts || [],
      politicianPosts: politicianPosts || [],
      sidebar: sidebarData || {}
    };
  } catch (error) {
    console.error('Failed to fetch home data:', error);
    // 에러가 발생해도 빈 데이터 반환 (완전 실패 방지)
    return {
      aiRanking: [],
      hotPosts: [],
      politicianPosts: [],
      sidebar: {}
    };
  }
}

/**
 * AI 평점 랭킹 조회 (필터링 가능)
 */
export async function getAIRanking(options?: {
  limit?: number;
  filterType?: 'region' | 'party' | 'position';
  filterValue?: string;
}): Promise<PoliticianRanking[]> {
  try {
    let query = supabase
      .from('politicians')
      .select(`
        *,
        ai_scores (
          claude_score,
          gpt_score,
          gemini_score,
          grok_score,
          perplexity_score,
          composite_score
        ),
        ratings (
          score
        )
      `)
      .not('ai_scores.composite_score', 'is', null);

    // 필터 적용
    if (options?.filterType && options?.filterValue) {
      query = query.eq(options.filterType, options.filterValue);
    }

    query = query
      .order('ai_scores.composite_score', { ascending: false })
      .limit(options?.limit || 10);

    const { data, error } = await query;

    if (error) throw error;

    // 데이터 변환
    return (data || []).map((p: any) => ({
      ...p,
      ...p.ai_scores,
      member_rating: p.ratings?.length
        ? p.ratings.reduce((sum: number, r: any) => sum + r.score, 0) / p.ratings.length
        : 0,
      member_rating_count: p.ratings?.length || 0
    }));
  } catch (error) {
    console.error('Failed to fetch AI ranking:', error);
    throw error;
  }
}

/**
 * 실시간 인기글 조회
 */
export async function getHotPosts(limit = 15): Promise<HotPost[]> {
  try {
    const { data, error } = await supabase
      .from('v_hot_posts_top15')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to fetch hot posts:', error);
    throw error;
  }
}

/**
 * 정치인 최근 글 조회
 */
export async function getPoliticianPosts(limit = 9): Promise<PoliticianPost[]> {
  try {
    const { data, error } = await supabase
      .from('v_politician_posts_recent9')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to fetch politician posts:', error);
    throw error;
  }
}

/**
 * 사이드바 데이터 조회
 */
export async function getSidebarData(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .rpc('get_sidebar_data', { p_user_id: user?.id || null });

    if (error) throw error;

    return data || {};
  } catch (error) {
    console.error('Failed to fetch sidebar data:', error);
    throw error;
  }
}
