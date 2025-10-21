'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertTriangle } from 'lucide-react'

interface SessionTimeoutWarningProps {
  open: boolean
  timeRemaining: number
  onExtend: () => Promise<boolean>
  onDismiss: () => void
  onSignOut?: () => void
}

export function SessionTimeoutWarning({
  open,
  timeRemaining,
  onExtend,
  onDismiss,
  onSignOut,
}: SessionTimeoutWarningProps) {
  const [isExtending, setIsExtending] = useState(false)
  const [displayTime, setDisplayTime] = useState(timeRemaining)

  useEffect(() => {
    setDisplayTime(timeRemaining)
  }, [timeRemaining])

  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [open])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleExtend = async () => {
    setIsExtending(true)
    try {
      const success = await onExtend()
      if (!success && onSignOut) {
        onSignOut()
      }
    } catch (error) {
      console.error('Failed to extend session:', error)
      if (onSignOut) {
        onSignOut()
      }
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription>
            Your session is about to expire due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <span className="font-semibold">Time remaining: </span>
              <span className="font-mono text-lg">{formatTime(displayTime)}</span>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Click "Extend Session" to continue working, or you will be automatically signed out.
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onSignOut}
            disabled={isExtending}
          >
            Sign Out
          </Button>
          <Button
            type="button"
            onClick={handleExtend}
            disabled={isExtending}
            className="min-w-[120px]"
          >
            {isExtending ? 'Extending...' : 'Extend Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
