/**
 * Image Optimization Utilities
 * P4F2: Lighthouse 90+ - Performance Optimization
 *
 * Utilities for optimizing images and generating placeholders
 */

/**
 * Generate a shimmer effect placeholder for images
 */
export function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="20%" />
          <stop stop-color="#f6f7f8" offset="40%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `
}

/**
 * Convert shimmer SVG to base64 data URL
 */
export function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
}

/**
 * Generate blur data URL for image placeholder
 */
export function getBlurDataURL(width: number = 100, height: number = 100): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`
}

/**
 * Get optimized image URL with Vercel Image Optimization
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  quality: number = 75
): string {
  if (!src) return ''

  // If it's already an external URL, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  // For local images, use Next.js Image Optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
}

/**
 * Calculate responsive image sizes
 */
export function getResponsiveSizes(config: {
  mobile?: number
  tablet?: number
  desktop?: number
}): string {
  const { mobile = 100, tablet = 50, desktop = 33 } = config

  return `(max-width: 640px) ${mobile}vw, (max-width: 1024px) ${tablet}vw, ${desktop}vw`
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' = 'image'): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = src
  document.head.appendChild(link)
}

/**
 * Lazy load image with IntersectionObserver
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  options?: IntersectionObserverInit
): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Fallback: load immediately
    if (img.dataset.src) {
      img.src = img.dataset.src
    }
    return () => {}
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement
        if (image.dataset.src) {
          image.src = image.dataset.src
          image.removeAttribute('data-src')
          observer.unobserve(image)
        }
      }
    })
  }, options || { rootMargin: '50px' })

  observer.observe(img)

  return () => observer.disconnect()
}

/**
 * Get image dimensions from URL
 */
export async function getImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = src
  })
}

/**
 * Check if WebP is supported
 */
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') return false

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Check if AVIF is supported
 */
export function isAVIFSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}
