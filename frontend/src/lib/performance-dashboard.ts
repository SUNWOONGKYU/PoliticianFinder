/**
 * Performance Dashboard Utilities
 * P4F2: Lighthouse 90+ - Performance Monitoring
 *
 * Utilities for tracking and displaying performance metrics
 */

interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  inp: number | null // Interaction to Next Paint
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  }

  if (typeof window === 'undefined' || !('performance' in window)) {
    return metrics
  }

  // Get navigation timing
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (navigation) {
    metrics.ttfb = navigation.responseStart - navigation.requestStart
  }

  // Get paint timing
  const paintEntries = performance.getEntriesByType('paint')
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime
  }

  return metrics
}

/**
 * Get performance score based on metrics
 */
export function getPerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100

  // FCP scoring (good: < 1.8s, needs improvement: < 3s, poor: >= 3s)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 20
    else if (metrics.fcp > 1800) score -= 10
  }

  // LCP scoring (good: < 2.5s, needs improvement: < 4s, poor: >= 4s)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 25
    else if (metrics.lcp > 2500) score -= 15
  }

  // FID scoring (good: < 100ms, needs improvement: < 300ms, poor: >= 300ms)
  if (metrics.fid) {
    if (metrics.fid > 300) score -= 20
    else if (metrics.fid > 100) score -= 10
  }

  // CLS scoring (good: < 0.1, needs improvement: < 0.25, poor: >= 0.25)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25
    else if (metrics.cls > 0.1) score -= 15
  }

  // TTFB scoring (good: < 800ms, needs improvement: < 1800ms, poor: >= 1800ms)
  if (metrics.ttfb) {
    if (metrics.ttfb > 1800) score -= 10
    else if (metrics.ttfb > 800) score -= 5
  }

  return Math.max(0, score)
}

/**
 * Get performance grade based on score
 */
export function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Format metric value for display
 */
export function formatMetric(value: number | null, unit: 'ms' | 's' | ''): string {
  if (value === null) return 'N/A'

  if (unit === 's') {
    return `${(value / 1000).toFixed(2)}s`
  }
  if (unit === 'ms') {
    return `${value.toFixed(0)}ms`
  }
  return value.toFixed(3)
}

/**
 * Get metric status (good, needs improvement, poor)
 */
export function getMetricStatus(
  metric: keyof PerformanceMetrics,
  value: number | null
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null) return 'unknown'

  const thresholds = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    inp: { good: 200, poor: 500 },
  }

  const threshold = thresholds[metric]
  if (!threshold) return 'unknown'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Get color for metric status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'good':
      return '#22c55e' // green-500
    case 'needs-improvement':
      return '#f59e0b' // amber-500
    case 'poor':
      return '#ef4444' // red-500
    default:
      return '#6b7280' // gray-500
  }
}

/**
 * Export metrics to console
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV !== 'development') return

  const metrics = getPerformanceMetrics()
  const score = getPerformanceScore(metrics)
  const grade = getPerformanceGrade(score)

  console.group('🚀 Performance Metrics')
  console.log('Score:', `${score}/100 (${grade})`)
  console.log('FCP:', formatMetric(metrics.fcp, 'ms'), getMetricStatus('fcp', metrics.fcp))
  console.log('LCP:', formatMetric(metrics.lcp, 'ms'), getMetricStatus('lcp', metrics.lcp))
  console.log('FID:', formatMetric(metrics.fid, 'ms'), getMetricStatus('fid', metrics.fid))
  console.log('CLS:', formatMetric(metrics.cls, ''), getMetricStatus('cls', metrics.cls))
  console.log('TTFB:', formatMetric(metrics.ttfb, 'ms'), getMetricStatus('ttfb', metrics.ttfb))
  console.log('INP:', formatMetric(metrics.inp, 'ms'), getMetricStatus('inp', metrics.inp))
  console.groupEnd()
}

/**
 * Get resource timing summary
 */
export function getResourceTimingSummary(): {
  total: number
  scripts: number
  stylesheets: number
  images: number
  fonts: number
  other: number
} {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return { total: 0, scripts: 0, stylesheets: 0, images: 0, fonts: 0, other: 0 }
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  return {
    total: resources.length,
    scripts: resources.filter((r) => r.initiatorType === 'script').length,
    stylesheets: resources.filter((r) => r.initiatorType === 'link' || r.initiatorType === 'css').length,
    images: resources.filter((r) => r.initiatorType === 'img').length,
    fonts: resources.filter((r) => r.initiatorType === 'font').length,
    other: resources.filter(
      (r) => !['script', 'link', 'css', 'img', 'font'].includes(r.initiatorType)
    ).length,
  }
}
