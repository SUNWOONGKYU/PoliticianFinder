"use client"

import * as React from "react"
import { X, MessageSquare, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

type FeedbackCategory = "bug" | "feature" | "improvement" | "other"

interface FeedbackFormData {
  category: FeedbackCategory
  title: string
  description: string
  email?: string
}

interface FeedbackModalProps {
  children?: React.ReactNode
  defaultOpen?: boolean
  onSubmit?: (feedback: FeedbackFormData) => Promise<void>
}

export function FeedbackModal({
  children,
  defaultOpen = false,
  onSubmit,
}: FeedbackModalProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState<FeedbackFormData>({
    category: "improvement",
    title: "",
    description: "",
    email: "",
  })
  const { toast } = useToast()

  const categories: { value: FeedbackCategory; label: string }[] = [
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "improvement", label: "Improvement" },
    { value: "other", label: "Other" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        // Default submission logic (mock API call)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Feedback submitted:", formData)
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      })

      // Reset form and close modal
      setFormData({
        category: "improvement",
        title: "",
        description: "",
        email: "",
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    field: keyof FeedbackFormData,
    value: string | FeedbackCategory
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve PoliticianFinder by sharing your thoughts, reporting
            bugs, or suggesting new features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Category Selection */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange("category", value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      formData.category === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                maxLength={100}
              />
              <span className="text-xs text-muted-foreground">
                {formData.title.length}/100
              </span>
            </div>

            {/* Description Textarea */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                className="min-h-[120px]"
                maxLength={1000}
              />
              <span className="text-xs text-muted-foreground">
                {formData.description.length}/1000
              </span>
            </div>

            {/* Email Input (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                We'll only use this to follow up on your feedback
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default FeedbackModal
