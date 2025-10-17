"use client"

import * as React from "react"
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface TourStep {
  target: string // CSS selector for the element to highlight
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right"
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  storageKey?: string // LocalStorage key to remember completion
}

export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  storageKey = "onboarding-tour-completed",
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const [placement, setPlacement] = React.useState<TourStep["placement"]>("bottom")

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Calculate position of tooltip based on target element
  React.useEffect(() => {
    if (!isOpen || !step?.target) return

    const updatePosition = () => {
      const targetElement = document.querySelector(step.target)
      if (!targetElement) return

      const rect = targetElement.getBoundingClientRect()
      const stepPlacement = step.placement || "bottom"
      setPlacement(stepPlacement)

      let top = 0
      let left = 0

      switch (stepPlacement) {
        case "top":
          top = rect.top - 20 // Offset for tooltip
          left = rect.left + rect.width / 2
          break
        case "bottom":
          top = rect.bottom + 20
          left = rect.left + rect.width / 2
          break
        case "left":
          top = rect.top + rect.height / 2
          left = rect.left - 20
          break
        case "right":
          top = rect.top + rect.height / 2
          left = rect.right + 20
          break
      }

      setPosition({ top, left })

      // Add highlight class to target
      document.querySelectorAll(".onboarding-highlight").forEach((el) => {
        el.classList.remove("onboarding-highlight")
      })
      targetElement.classList.add("onboarding-highlight")
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition)
      document.querySelectorAll(".onboarding-highlight").forEach((el) => {
        el.classList.remove("onboarding-highlight")
      })
    }
  }, [isOpen, currentStep, step])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "skipped")
    }
    onClose()
  }

  const handleComplete = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "completed")
    }
    onComplete?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleSkip}
      />

      {/* Tooltip Card */}
      <Card
        className={cn(
          "fixed z-50 w-80 p-4 shadow-lg",
          placement === "left" && "transform -translate-x-full -translate-y-1/2",
          placement === "right" && "transform -translate-y-1/2",
          placement === "top" && "transform -translate-x-1/2 -translate-y-full",
          placement === "bottom" && "transform -translate-x-1/2"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close tour</span>
        </button>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base">{step?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{step?.content}</p>
          </div>

          {/* Optional Action Button */}
          {step?.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={step.action.onClick}
              className="w-full"
            >
              {step.action.label}
            </Button>
          )}

          {/* Progress Dots */}
          <div className="flex justify-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Global Styles for Highlight */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </>
  )
}

// Hook to manage tour state
export function useOnboardingTour(storageKey = "onboarding-tour-completed") {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const completed = localStorage.getItem(storageKey)
    if (!completed) {
      // Auto-start tour on first visit
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  const startTour = () => setIsOpen(true)
  const closeTour = () => setIsOpen(false)
  const resetTour = () => {
    localStorage.removeItem(storageKey)
    setIsOpen(true)
  }

  return { isOpen, startTour, closeTour, resetTour }
}

export default OnboardingTour
