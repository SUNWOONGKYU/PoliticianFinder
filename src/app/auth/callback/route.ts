import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    // P4B4: Rate limiting (5 requests per 15 minutes)
    const rateLimitResponse = await applyRateLimit(request, "auth")
    if (rateLimitResponse) {
      return NextResponse.redirect(new URL('/login?error=rate_limit', request.url))
    }

    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })

      // OAuth 코드를 세션으로 교환
      await supabase.auth.exchangeCodeForSession(code)

      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 프로필 자동 생성 (없는 경우)
        await createProfileIfNotExists(supabase, user)
      }
    }

    // 홈으로 리디렉션
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}

async function createProfileIfNotExists(supabase: any, user: any) {
  try {
    // 기존 프로필 확인
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // 프로필이 없는 경우에만 생성
    if (!existingProfile && selectError?.code === 'PGRST116') {
      // 소셜 로그인 제공자별 프로필 정보 추출
      const providerData = user.user_metadata || {}

      // 제공자별 username 결정
      let username = providerData.full_name ||
                    providerData.name ||
                    providerData.nickname ||
                    providerData.preferred_username ||
                    user.email?.split('@')[0] ||
                    'user'

      // 한국어 이름 처리 (카카오, 네이버의 경우)
      if (providerData.kakao_account?.profile?.nickname) {
        username = providerData.kakao_account.profile.nickname
      }

      // 아바타 URL 처리
      let avatarUrl = providerData.avatar_url ||
                     providerData.picture ||
                     providerData.profile_image_url ||
                     null

      // 프로필 생성
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: username,
          avatar_url: avatarUrl,
          provider: user.app_metadata?.provider || 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
      } else {
        console.log('Profile created successfully for user:', user.id)
      }
    }
  } catch (error) {
    console.error('Error in createProfileIfNotExists:', error)
  }
}