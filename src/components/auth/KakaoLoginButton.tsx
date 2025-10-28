'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export function KakaoLoginButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Kakao login error:', error)
      alert('카카오 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleKakaoLogin}
      disabled={loading}
      variant="outline"
      className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] border-0"
    >
      <svg className="mr-2 h-5 w-5" viewBox="0 0 18 18">
        <path fill="currentColor" d="M9 0C4.03 0 0 3.37 0 7.5c0 2.74 1.82 5.14 4.58 6.43-.2.73-.68 2.52-.77 2.93-.11.5.18.49.38.36.15-.1 2.47-1.62 3.41-2.24.47.06.95.1 1.44.1 4.97 0 9-3.37 9-7.5S13.97 0 9 0z"/>
      </svg>
      {loading ? '로그인 중...' : '카카오로 계속하기'}
    </Button>
  )
}