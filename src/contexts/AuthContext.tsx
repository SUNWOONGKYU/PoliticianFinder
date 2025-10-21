'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ requiresMFA: boolean, factorId?: string }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  checkMFAStatus: () => Promise<{ enabled: boolean, factors: any[] }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Session timeout management
  const {
    showWarning,
    timeRemaining,
    isExpired,
    refreshSession,
    dismissWarning,
  } = useSessionTimeout()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN') {
        // Check if MFA is required
        const assuranceLevel = await supabase.auth.mfa.getAuthenticatorAssuranceLevels()
        if (assuranceLevel?.currentLevel === 'aal1' && assuranceLevel?.nextLevel === 'aal2') {
          // MFA is required but not yet completed
          router.push('/auth/mfa-verify')
        } else {
          router.push('/') // Redirect to home after successful sign in
        }
      }

      if (event === 'SIGNED_OUT') {
        router.push('/') // Redirect to home after sign out
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signInWithEmail = async (email: string, password: string): Promise<{ requiresMFA: boolean, factorId?: string }> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Error signing in:', error)
        throw error
      }

      // Check if MFA is required
      if (data.session) {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') || []

        if (verifiedFactors.length > 0) {
          const assuranceLevel = await supabase.auth.mfa.getAuthenticatorAssuranceLevels()
          if (assuranceLevel?.currentLevel === 'aal1' && assuranceLevel?.nextLevel === 'aal2') {
            // MFA is required
            return { requiresMFA: true, factorId: verifiedFactors[0].id }
          }
        }
      }

      return { requiresMFA: false }
    } catch (error) {
      console.error('Error in signInWithEmail:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Error signing in with Google:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const checkMFAStatus = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') || []

      return {
        enabled: verifiedFactors.length > 0,
        factors: verifiedFactors
      }
    } catch (error) {
      console.error('Error checking MFA status:', error)
      return { enabled: false, factors: [] }
    }
  }

  // Handle session expiry
  useEffect(() => {
    if (isExpired && user) {
      console.warn('Session expired, signing out user')
      signOut()
    }
  }, [isExpired, user])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    checkMFAStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutWarning
        open={showWarning && !!user}
        timeRemaining={timeRemaining}
        onExtend={refreshSession}
        onDismiss={dismissWarning}
        onSignOut={signOut}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Protected route component
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}