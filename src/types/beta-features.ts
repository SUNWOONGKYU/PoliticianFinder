/**
 * Type definitions for P5F1-F3 Beta Launch Features
 */

// P5F1: Feedback Modal Types
export type FeedbackCategory = "bug" | "feature" | "improvement" | "other"

export interface FeedbackFormData {
  category: FeedbackCategory
  title: string
  description: string
  email?: string
}

// P5F2: Onboarding Tour Types
export interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right"
  action?: {
    label: string
    onClick: () => void
  }
}

export interface OnboardingTourState {
  isOpen: boolean
  currentStep: number
  completed: boolean
}

// P5F3: Announcement Types
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
  showOnce?: boolean
}

export interface AnnouncementState {
  currentAnnouncement: Announcement | null
  isOpen: boolean
  dismissedIds: string[]
}
