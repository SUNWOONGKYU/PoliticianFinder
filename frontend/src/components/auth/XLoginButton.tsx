'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export function XLoginButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleXLogin = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('X login error:', error)
      alert('X 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleXLogin}
      disabled={loading}
      variant="outline"
      className="w-full bg-[#000000] hover:bg-[#000000]/90 text-white border-0"
    >
      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      {loading ? '로그인 중...' : 'X로 계속하기'}
    </Button>
  )
}