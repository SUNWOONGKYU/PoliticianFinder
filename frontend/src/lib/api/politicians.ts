// 정치인 관련 API 함수들
import { supabase } from '../supabase'
import { PoliticianDetail, RatingDistribution } from '@/types/politician'
import { RatingItem, RatingStats, RatingListResponse, CreateRatingRequest, RatingFilterOptions } from '@/types/rating'
import { Politician, Rating, RatingWithProfile } from '@/types/database'

// 정치인 상세 정보 가져오기
export async function getPoliticianDetail(id: number): Promise<PoliticianDetail | null> {
  try {
    // 정치인 기본 정보 가져오기
    const { data: politician, error } = await supabase
      .from('politicians')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !politician) {
      console.error('Error fetching politician:', error)
      return null
    }

    // 평가 분포 계산
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('score')
      .eq('politician_id', id)

    let distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    if (ratings && !ratingsError) {
      ratings.forEach((rating) => {
        const score = rating.score as 1 | 2 | 3 | 4 | 5
        distribution[score]++
      })
    }

    // AI 점수 정보 (현재는 더미 데이터, 추후 실제 데이터로 대체)
    const aiScores = {
      claude: politician.ai_score_claude || undefined,
      gpt: undefined,
      gemini: undefined,
      perplexity: undefined,
      grok: undefined
    }

    // PoliticianDetail 형식으로 변환
    const politicianDetail: PoliticianDetail = {
      id: politician.id,
      name: politician.name,
      party: politician.party || '무소속',
      region: politician.district || '',
      position: politician.position || '',
      profile_image_url: politician.profile_image_url || '',
      biography: politician.bio || '',
      official_website: politician.website_url || '',
      avg_rating: politician.avg_rating || 0,
      total_ratings: politician.total_ratings || 0,
      ai_scores: aiScores,
      rating_distribution: distribution,
      total_posts: 0, // 추후 구현
      created_at: politician.created_at,
      updated_at: politician.updated_at
    }

    return politicianDetail
  } catch (error) {
    console.error('Error in getPoliticianDetail:', error)
    return null
  }
}

// 정치인 평가 목록 가져오기
export async function getPoliticianRatings(
  politicianId: number,
  options: RatingFilterOptions = {}
): Promise<RatingListResponse> {
  const {
    category,
    minScore,
    maxScore,
    hasComment,
    sortBy = 'recent',
    page = 1,
    limit = 10
  } = options

  try {
    let query = supabase
      .from('ratings')
      .select(`
        *,
        profiles!inner(username, avatar_url)
      `, { count: 'exact' })
      .eq('politician_id', politicianId)

    // 필터 적용
    if (category) {
      query = query.eq('category', category)
    }
    if (minScore) {
      query = query.gte('score', minScore)
    }
    if (maxScore) {
      query = query.lte('score', maxScore)
    }
    if (hasComment === true) {
      query = query.not('comment', 'is', null)
    }
    if (hasComment === false) {
      query = query.is('comment', null)
    }

    // 정렬 적용
    switch (sortBy) {
      case 'rating_high':
        query = query.order('score', { ascending: false })
        break
      case 'rating_low':
        query = query.order('score', { ascending: true })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching ratings:', error)
      return {
        ratings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }
    }

    // RatingItem 형식으로 변환
    const ratings: RatingItem[] = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      politician_id: item.politician_id,
      score: item.score,
      comment: item.comment,
      category: item.category,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user: item.profiles ? {
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url
      } : undefined
    }))

    return {
      ratings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error) {
    console.error('Error in getPoliticianRatings:', error)
    return {
      ratings: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    }
  }
}

// 평가 통계 가져오기
export async function getRatingStats(politicianId: number): Promise<RatingStats | null> {
  try {
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('avg_rating, total_ratings')
      .eq('id', politicianId)
      .single()

    if (politicianError || !politician) {
      console.error('Error fetching politician stats:', politicianError)
      return null
    }

    // 평가 분포 계산
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('score, category')
      .eq('politician_id', politicianId)

    let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let categoryBreakdown: { [key: string]: { count: number; average: number; total: number } } = {}

    if (ratings && !ratingsError) {
      ratings.forEach((rating) => {
        // 분포 계산
        const score = rating.score as 1 | 2 | 3 | 4 | 5
        distribution[score]++

        // 카테고리별 통계
        const category = rating.category || 'overall'
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { count: 0, average: 0, total: 0 }
        }
        categoryBreakdown[category].count++
        categoryBreakdown[category].total += rating.score
      })

      // 카테고리별 평균 계산
      Object.keys(categoryBreakdown).forEach(key => {
        if (categoryBreakdown[key].count > 0) {
          categoryBreakdown[key].average = categoryBreakdown[key].total / categoryBreakdown[key].count
        }
        // total 제거 (불필요)
        delete (categoryBreakdown[key] as any).total
      })
    }

    return {
      averageScore: politician.avg_rating || 0,
      totalRatings: politician.total_ratings || 0,
      distribution,
      categoryBreakdown
    }
  } catch (error) {
    console.error('Error in getRatingStats:', error)
    return null
  }
}

// 평가 생성
export async function createRating(rating: CreateRatingRequest): Promise<RatingItem | null> {
  try {
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('로그인이 필요합니다.')
    }

    // 기존 평가 확인
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('politician_id', rating.politician_id)
      .eq('user_id', user.id)
      .single()

    if (existingRating) {
      throw new Error('이미 평가하셨습니다.')
    }

    // 평가 생성
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        user_id: user.id,
        politician_id: rating.politician_id,
        score: rating.score,
        comment: rating.comment || null,
        category: rating.category || 'overall'
      })
      .select(`
        *,
        profiles!inner(username, avatar_url)
      `)
      .single()

    if (error) {
      throw error
    }

    // 정치인 통계 업데이트 (트리거로 처리되지만 즉시 반영을 위해)
    await updatePoliticianStats(rating.politician_id)

    return {
      id: data.id,
      user_id: data.user_id,
      politician_id: data.politician_id,
      score: data.score,
      comment: data.comment,
      category: data.category,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: data.profiles ? {
        username: data.profiles.username,
        avatar_url: data.profiles.avatar_url
      } : undefined
    }
  } catch (error) {
    console.error('Error creating rating:', error)
    return null
  }
}

// 정치인 통계 업데이트
async function updatePoliticianStats(politicianId: number): Promise<void> {
  try {
    const { data: ratings } = await supabase
      .from('ratings')
      .select('score')
      .eq('politician_id', politicianId)

    if (!ratings || ratings.length === 0) return

    const total = ratings.length
    const sum = ratings.reduce((acc, r) => acc + r.score, 0)
    const average = sum / total

    await supabase
      .from('politicians')
      .update({
        avg_rating: Math.round(average * 10) / 10,
        total_ratings: total
      })
      .eq('id', politicianId)
  } catch (error) {
    console.error('Error updating politician stats:', error)
  }
}

// 사용자의 평가 확인
export async function getUserRatingForPolitician(politicianId: number): Promise<RatingItem | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        profiles!inner(username, avatar_url)
      `)
      .eq('politician_id', politicianId)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      user_id: data.user_id,
      politician_id: data.politician_id,
      score: data.score,
      comment: data.comment,
      category: data.category,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: data.profiles ? {
        username: data.profiles.username,
        avatar_url: data.profiles.avatar_url
      } : undefined
    }
  } catch (error) {
    console.error('Error checking user rating:', error)
    return null
  }
}