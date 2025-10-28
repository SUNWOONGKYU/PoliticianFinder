# P5F1-F3: Beta Launch Features Implementation

This document describes the implementation of three key features for the PoliticianFinder beta launch.

## Overview

- **P5F1**: User Feedback Modal - Collect user feedback, bug reports, and feature requests
- **P5F2**: Interactive Onboarding Tour - Guide new users through the application
- **P5F3**: Announcement Modal - Display important notices with dismiss functionality

## Components

### P5F1: User Feedback Modal

**Location**: `src/components/feedback/FeedbackModal.tsx`

#### Features
- Category selection (Bug Report, Feature Request, Improvement, Other)
- Title and description fields with character limits
- Optional email field for follow-up
- Form validation
- Toast notifications
- Customizable submission handler

#### Usage
```tsx
import { FeedbackModal } from "@/components/feedback"

function MyComponent() {
  const handleSubmit = async (feedback) => {
    await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify(feedback),
    })
  }

  return (
    <FeedbackModal onSubmit={handleSubmit}>
      <Button>Send Feedback</Button>
    </FeedbackModal>
  )
}
```

#### Props
- `children`: Trigger button (optional)
- `defaultOpen`: Open modal by default
- `onSubmit`: Custom submission handler

---

### P5F2: Interactive Onboarding Tour

**Location**: `src/components/onboarding/OnboardingTour.tsx`

#### Features
- Step-by-step guided tour
- Element highlighting with CSS
- Configurable placement (top, bottom, left, right)
- Progress indicators
- Navigation controls (Next, Back, Skip)
- localStorage persistence
- Custom actions per step
- Auto-start on first visit

#### Usage
```tsx
import { OnboardingTour, useOnboardingTour } from "@/components/onboarding"

function MyComponent() {
  const { isOpen, closeTour, startTour } = useOnboardingTour()

  const steps = [
    {
      target: "#search-bar",
      title: "Search",
      content: "Find politicians here",
      placement: "bottom",
    },
    {
      target: "#filters",
      title: "Filters",
      content: "Refine your search",
      placement: "right",
    },
  ]

  return (
    <>
      <Button onClick={startTour}>Start Tour</Button>
      <OnboardingTour
        steps={steps}
        isOpen={isOpen}
        onClose={closeTour}
      />
    </>
  )
}
```

#### Tour Step Interface
```typescript
interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right"
  action?: {
    label: string
    onClick: () => void
  }
}
```

---

### P5F3: Announcement Modal

**Location**: `src/components/announcement/AnnouncementModal.tsx`

#### Features
- Multiple announcement types (info, warning, success, announcement)
- Visual type indicators with icons
- Date display
- Custom action buttons
- Dismiss functionality
- "Show once" support with localStorage
- Auto-display on mount

#### Usage
```tsx
import { AnnouncementModal, useAnnouncement } from "@/components/announcement"

function MyComponent() {
  const announcements = [
    {
      id: "welcome-2025",
      type: "announcement",
      title: "Welcome!",
      message: "Thanks for trying our beta",
      action: {
        label: "Get Started",
        onClick: () => console.log("Action clicked"),
      },
      dismissible: true,
      showOnce: true,
    },
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

#### Announcement Interface
```typescript
interface Announcement {
  id: string
  type: "info" | "warning" | "success" | "announcement"
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
```

---

## Integration Example

See `src/components/examples/BetaFeaturesExample.tsx` for a complete integration example.

## Dependencies

All components use existing shadcn/ui components:
- `dialog` - Modal overlay and content
- `button` - Interactive buttons
- `textarea` - Multi-line text input
- `input` - Single-line text input
- `label` - Form labels
- `badge` - Status badges
- `card` - Container component
- `use-toast` - Toast notifications

## Styling

All components use Tailwind CSS and are fully responsive. They follow the project's design system with support for light/dark themes.

## localStorage Keys

- `onboarding-tour-completed`: Tour completion status
- `dismissed-announcements`: Array of dismissed announcement IDs

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- localStorage support required for persistence

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Focus management

## Testing

To test these components:
1. Visit `/examples/beta-features` (create this route)
2. Or integrate into existing pages
3. Check localStorage for persistence
4. Test on mobile and desktop viewports
