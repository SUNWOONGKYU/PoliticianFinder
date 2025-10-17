'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000 // 5 minutes before expiry
const TOKEN_REFRESH_BUFFER = 60 * 1000 // Refresh 1 minute before expiry
const CHECK_INTERVAL = 30 * 1000 // Check every 30 seconds

export interface SessionTimeoutState {
  showWarning: boolean
  timeRemaining: number
  isExpired: boolean
}

export function useSessionTimeout() {
  const [state, setState] = useState<SessionTimeoutState>({
    showWarning: false,
    timeRemaining: 0,
    isExpired: false,
  })

  const refreshTimerRef = useRef<NodeJS.Timeout>()
  const checkTimerRef = useRef<NodeJS.Timeout>()

  const calculateTimeRemaining = useCallback((expiresAt: number): number => {
    return Math.max(0, expiresAt - Date.now())
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Failed to refresh session:', error)
        setState(prev => ({ ...prev, isExpired: true, showWarning: false }))
        return false
      }

      if (data.session) {
        console.log('Session refreshed successfully')
        setState(prev => ({ ...prev, showWarning: false, isExpired: false }))
        return true
      }

      return false
    } catch (error) {
      console.error('Error refreshing session:', error)
      setState(prev => ({ ...prev, isExpired: true, showWarning: false }))
      return false
    }
  }, [])

  const setupTimers = useCallback((expiresAt: number) => {
    // Clear existing timers
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (checkTimerRef.current) clearInterval(checkTimerRef.current)

    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // Schedule automatic refresh before token expires
    const refreshTime = Math.max(0, timeUntilExpiry - TOKEN_REFRESH_BUFFER)
    refreshTimerRef.current = setTimeout(() => {
      refreshSession()
    }, refreshTime)

    // Set up periodic checks for showing warning
    checkTimerRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt)

      if (remaining <= 0) {
        setState(prev => ({ ...prev, isExpired: true, showWarning: false }))
        if (checkTimerRef.current) clearInterval(checkTimerRef.current)
        return
      }

      if (remaining <= SESSION_TIMEOUT_WARNING && remaining > 0) {
        setState(prev => ({
          ...prev,
          showWarning: true,
          timeRemaining: remaining,
          isExpired: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          showWarning: false,
          timeRemaining: remaining,
          isExpired: false,
        }))
      }
    }, CHECK_INTERVAL)
  }, [calculateTimeRemaining, refreshSession])

  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000 // Convert to milliseconds
          setupTimers(expiresAt)
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      }
    }

    initializeSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.expires_at) {
            const expiresAt = session.expires_at * 1000
            setupTimers(expiresAt)
          }
        } else if (event === 'SIGNED_OUT') {
          setState({ showWarning: false, timeRemaining: 0, isExpired: true })
          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
          if (checkTimerRef.current) clearInterval(checkTimerRef.current)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      if (checkTimerRef.current) clearInterval(checkTimerRef.current)
    }
  }, [setupTimers])

  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, showWarning: false }))
  }, [])

  const extendSession = useCallback(async () => {
    const success = await refreshSession()
    if (success) {
      dismissWarning()
    }
    return success
  }, [refreshSession, dismissWarning])

  return {
    ...state,
    refreshSession: extendSession,
    dismissWarning,
  }
}
