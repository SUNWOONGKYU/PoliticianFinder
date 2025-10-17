"use client"

/**
 * Example Usage of P5F1-F3 Components
 *
 * This file demonstrates how to integrate the three beta launch features:
 * - P5F1: User Feedback Modal
 * - P5F2: Onboarding Tour
 * - P5F3: Announcement Modal
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FeedbackModal } from "@/components/feedback"
import { OnboardingTour, useOnboardingTour, type TourStep } from "@/components/onboarding"
import {
  AnnouncementModal,
  useAnnouncement,
  type Announcement,
} from "@/components/announcement"

export function BetaFeaturesExample() {
  // P5F2: Onboarding Tour Setup
  const { isOpen: isTourOpen, closeTour, startTour, resetTour } = useOnboardingTour()

  const tourSteps: TourStep[] = [
    {
      target: "#search-input",
      title: "Search Politicians",
      content: "Use this search bar to find politicians by name, party, or region.",
      placement: "bottom",
    },
    {
      target: "#filter-button",
      title: "Filter Results",
      content: "Click here to filter politicians by party, region, or other criteria.",
      placement: "bottom",
    },
    {
      target: "#sort-dropdown",
      title: "Sort Options",
      content: "Sort the results by name, rating, or other attributes.",
      placement: "bottom",
    },
    {
      target: "#feedback-button",
      title: "Send Feedback",
      content: "Found a bug or have a suggestion? Let us know here!",
      placement: "left",
      action: {
        label: "Open Feedback Form",
        onClick: () => {
          // Trigger feedback modal open
          console.log("Open feedback modal")
        },
      },
    },
  ]

  // P5F3: Announcement Setup
  const announcements: Announcement[] = [
    {
      id: "beta-launch-2025",
      type: "announcement",
      title: "Welcome to PoliticianFinder Beta!",
      message:
        "We're excited to have you here. This is a beta version, so you might encounter some bugs. Please use the feedback button to report any issues or share your thoughts!",
      date: "January 2025",
      action: {
        label: "Start Tour",
        onClick: () => startTour(),
      },
      dismissible: true,
      showOnce: true,
    },
    {
      id: "new-features-jan-2025",
      type: "info",
      title: "New Features Available",
      message:
        "Check out our new rating system, comment threads, and bookmarking features. Explore and let us know what you think!",
      dismissible: true,
      showOnce: true,
    },
  ]

  const {
    currentAnnouncement,
    isOpen: isAnnouncementOpen,
    closeAnnouncement,
    showAnnouncement,
  } = useAnnouncement(announcements)

  // P5F1: Feedback submission handler
  const handleFeedbackSubmit = async (feedback: any) => {
    // Example: Send to API
    console.log("Submitting feedback:", feedback)

    // In production, you would send this to your backend:
    // const response = await fetch("/api/feedback", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(feedback),
    // })

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Beta Features Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates the three beta launch features for PoliticianFinder.
        </p>
      </div>

      {/* Demo Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* P5F1: Feedback Modal */}
        <div className="space-y-2 p-4 border rounded-lg">
          <h2 className="font-semibold">P5F1: User Feedback</h2>
          <p className="text-sm text-muted-foreground">
            Collect user feedback, bug reports, and feature requests.
          </p>
          <FeedbackModal onSubmit={handleFeedbackSubmit}>
            <Button className="w-full" id="feedback-button">
              Open Feedback Form
            </Button>
          </FeedbackModal>
        </div>

        {/* P5F2: Onboarding Tour */}
        <div className="space-y-2 p-4 border rounded-lg">
          <h2 className="font-semibold">P5F2: Onboarding Tour</h2>
          <p className="text-sm text-muted-foreground">
            Interactive walkthrough for new users.
          </p>
          <div className="space-y-2">
            <Button onClick={startTour} className="w-full">
              Start Tour
            </Button>
            <Button onClick={resetTour} variant="outline" className="w-full">
              Reset Tour
            </Button>
          </div>
        </div>

        {/* P5F3: Announcement Modal */}
        <div className="space-y-2 p-4 border rounded-lg">
          <h2 className="font-semibold">P5F3: Announcements</h2>
          <p className="text-sm text-muted-foreground">
            Display important notices and updates.
          </p>
          <Button
            onClick={() => showAnnouncement(announcements[0])}
            className="w-full"
          >
            Show Announcement
          </Button>
        </div>
      </div>

      {/* Mock UI Elements for Tour */}
      <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
        <h3 className="font-semibold">Mock UI Elements (for tour demo)</h3>
        <div className="flex gap-4">
          <input
            id="search-input"
            type="text"
            placeholder="Search politicians..."
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button id="filter-button" variant="outline">
            Filter
          </Button>
          <select id="sort-dropdown" className="px-3 py-2 border rounded-md">
            <option>Sort by...</option>
            <option>Name</option>
            <option>Rating</option>
          </select>
        </div>
      </div>

      {/* Components */}
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={closeTour}
        onComplete={() => console.log("Tour completed!")}
      />

      <AnnouncementModal
        announcement={currentAnnouncement}
        isOpen={isAnnouncementOpen}
        onClose={closeAnnouncement}
      />
    </div>
  )
}

export default BetaFeaturesExample
