"use client"

import * as React from "react"
import { X, Info, AlertCircle, CheckCircle, Megaphone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AnnouncementType = "info" | "warning" | "success" | "announcement"

export interface Announcement {
  id: string
  type: AnnouncementType
  title: string
  message: string
  date?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  dismissible?: boolean
  showOnce?: boolean // Only show once per user
}

interface AnnouncementModalProps {
  announcement: Announcement | null
  isOpen: boolean
  onClose: () => void
  storageKey?: string
}

const typeConfig: Record<
  AnnouncementType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  announcement: {
    icon: Megaphone,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
}

export function AnnouncementModal({
  announcement,
  isOpen,
  onClose,
  storageKey = "dismissed-announcements",
}: AnnouncementModalProps) {
  const handleDismiss = () => {
    if (announcement?.showOnce && announcement?.id) {
      // Store dismissed announcement ID in localStorage
      const dismissed = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      ) as string[]
      if (!dismissed.includes(announcement.id)) {
        localStorage.setItem(
          storageKey,
          JSON.stringify([...dismissed, announcement.id])
        )
      }
    }
    onClose()
  }

  const handleAction = () => {
    if (announcement?.action?.onClick) {
      announcement.action.onClick()
    } else if (announcement?.action?.href) {
      window.location.href = announcement.action.href
    }
    handleDismiss()
  }

  if (!announcement) return null

  const config = typeConfig[announcement.type]
  const Icon = config.icon

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-full",
                config.bgColor
              )}
            >
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg">{announcement.title}</DialogTitle>
                <Badge variant="outline" className="capitalize">
                  {announcement.type}
                </Badge>
              </div>
              {announcement.date && (
                <span className="text-xs text-muted-foreground">
                  {announcement.date}
                </span>
              )}
            </div>
            {announcement.dismissible !== false && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            )}
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-foreground leading-relaxed pt-2">
          {announcement.message}
        </DialogDescription>

        <DialogFooter className="flex-row justify-end gap-2">
          {announcement.dismissible !== false && (
            <Button variant="outline" onClick={handleDismiss}>
              Dismiss
            </Button>
          )}
          {announcement.action && (
            <Button onClick={handleAction}>
              {announcement.action.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage announcements
export function useAnnouncement(
  announcements: Announcement[],
  storageKey = "dismissed-announcements"
) {
  const [currentAnnouncement, setCurrentAnnouncement] =
    React.useState<Announcement | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    // Get dismissed announcements from localStorage
    const dismissed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    ) as string[]

    // Find the first announcement that hasn't been dismissed
    const nextAnnouncement = announcements.find(
      (announcement) =>
        !announcement.showOnce || !dismissed.includes(announcement.id)
    )

    if (nextAnnouncement) {
      setCurrentAnnouncement(nextAnnouncement)
      setIsOpen(true)
    }
  }, [announcements, storageKey])

  const showAnnouncement = (announcement: Announcement) => {
    setCurrentAnnouncement(announcement)
    setIsOpen(true)
  }

  const closeAnnouncement = () => {
    setIsOpen(false)
  }

  const clearDismissedAnnouncements = () => {
    localStorage.removeItem(storageKey)
  }

  return {
    currentAnnouncement,
    isOpen,
    showAnnouncement,
    closeAnnouncement,
    clearDismissedAnnouncements,
  }
}

export default AnnouncementModal
