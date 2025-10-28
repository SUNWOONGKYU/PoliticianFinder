# P5F1-F3 Quick Start Guide

## Installation
All components are ready to use. No additional packages needed.

## 1. Feedback Modal (P5F1)

### Basic Usage
```tsx
import { FeedbackModal } from "@/components/feedback"

<FeedbackModal />
```

### With Custom Trigger
```tsx
<FeedbackModal>
  <Button>Report Issue</Button>
</FeedbackModal>
```

### With API Integration
```tsx
const handleSubmit = async (feedback) => {
  await fetch("/api/feedback", {
    method: "POST",
    body: JSON.stringify(feedback)
  })
}

<FeedbackModal onSubmit={handleSubmit} />
```

---

## 2. Onboarding Tour (P5F2)

### Setup
```tsx
import { OnboardingTour, useOnboardingTour } from "@/components/onboarding"

function MyPage() {
  const { isOpen, closeTour } = useOnboardingTour()

  const steps = [
    {
      target: "#element-id",
      title: "Welcome",
      content: "This is how it works",
      placement: "bottom"
    }
  ]

  return (
    <OnboardingTour
      steps={steps}
      isOpen={isOpen}
      onClose={closeTour}
    />
  )
}
```

### Manual Control
```tsx
const { startTour, resetTour } = useOnboardingTour()

<Button onClick={startTour}>Help</Button>
<Button onClick={resetTour}>Reset Tutorial</Button>
```

---

## 3. Announcement Modal (P5F3)

### Basic Setup
```tsx
import { AnnouncementModal, useAnnouncement } from "@/components/announcement"

function App() {
  const announcements = [
    {
      id: "welcome",
      type: "announcement",
      title: "Welcome!",
      message: "Thanks for joining beta",
      showOnce: true
    }
  ]

  const { currentAnnouncement, isOpen, closeAnnouncement } =
    useAnnouncement(announcements)

  return (
    <AnnouncementModal
      announcement={currentAnnouncement}
      isOpen={isOpen}
      onClose={closeAnnouncement}
    />
  )
}
```

### With Action Button
```tsx
{
  id: "feature",
  type: "info",
  title: "New Feature",
  message: "Check out our new rating system",
  action: {
    label: "Try Now",
    href: "/politicians"
  }
}
```

---

## Complete Integration Example

```tsx
"use client"

import { FeedbackModal } from "@/components/feedback"
import { OnboardingTour, useOnboardingTour } from "@/components/onboarding"
import { AnnouncementModal, useAnnouncement } from "@/components/announcement"

export default function Layout({ children }) {
  // Onboarding
  const { isOpen, closeTour } = useOnboardingTour()
  const tourSteps = [
    { target: "#search", title: "Search", content: "Find politicians", placement: "bottom" },
    { target: "#filter", title: "Filter", content: "Refine results", placement: "right" }
  ]

  // Announcements
  const announcements = [{
    id: "beta-2025",
    type: "announcement",
    title: "Beta Launch",
    message: "Welcome to PoliticianFinder Beta!",
    showOnce: true
  }]
  const { currentAnnouncement, isOpen: announcementOpen, closeAnnouncement } =
    useAnnouncement(announcements)

  return (
    <>
      {children}

      {/* Feedback button in header */}
      <FeedbackModal />

      {/* Tour */}
      <OnboardingTour steps={tourSteps} isOpen={isOpen} onClose={closeTour} />

      {/* Announcements */}
      <AnnouncementModal
        announcement={currentAnnouncement}
        isOpen={announcementOpen}
        onClose={closeAnnouncement}
      />
    </>
  )
}
```

## File Locations

```
src/components/
├── feedback/FeedbackModal.tsx
├── onboarding/OnboardingTour.tsx
└── announcement/AnnouncementModal.tsx
```

## Testing

Visit `src/components/examples/BetaFeaturesExample.tsx` for interactive demo.
