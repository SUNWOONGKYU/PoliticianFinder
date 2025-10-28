/**
 * Date formatting utilities
 */

export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean; locale?: any }): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSecs = Math.floor(diffInMs / 1000)
  const diffInMins = Math.floor(diffInSecs / 60)
  const diffInHours = Math.floor(diffInMins / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  let result = ''

  if (diffInSecs < 60) {
    result = '방금'
  } else if (diffInMins < 60) {
    result = `${diffInMins}분`
  } else if (diffInHours < 24) {
    result = `${diffInHours}시간`
  } else if (diffInDays < 7) {
    result = `${diffInDays}일`
  } else if (diffInWeeks < 4) {
    result = `${diffInWeeks}주`
  } else if (diffInMonths < 12) {
    result = `${diffInMonths}개월`
  } else {
    result = `${diffInYears}년`
  }

  if (options?.addSuffix && result !== '방금') {
    result += ' 전'
  }

  return result
}

export const ko = {
  // Korean locale stub for compatibility
}