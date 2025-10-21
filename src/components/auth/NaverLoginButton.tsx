'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export function NaverLoginButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleNaverLogin = async () => {
    try {
      setLoading(true)

      // Supabase가 Naver를 기본 지원하지 않으므로,
      // Custom OAuth 또는 직접 구현 필요
      // 현재는 플레이스홀더로 구현
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'naver' as any,  // Custom provider
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Naver login error:', error)
      alert('네이버 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleNaverLogin}
      disabled={loading}
      variant="outline"
      className="w-full bg-[#03C75A] hover:bg-[#03C75A]/90 text-white border-0"
    >
      <span className="mr-2 font-bold text-white">N</span>
      {loading ? '로그인 중...' : '네이버로 계속하기'}
    </Button>
  )
}