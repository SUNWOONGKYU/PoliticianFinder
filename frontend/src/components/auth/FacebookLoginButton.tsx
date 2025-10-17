'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Facebook } from 'lucide-react'

export function FacebookLoginButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleFacebookLogin = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Facebook login error:', error)
      alert('페이스북 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleFacebookLogin}
      disabled={loading}
      variant="outline"
      className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0"
    >
      <Facebook className="mr-2 h-4 w-4" />
      {loading ? '로그인 중...' : 'Facebook으로 계속하기'}
    </Button>
  )
}