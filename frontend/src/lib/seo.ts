/**
 * SEO Utilities
 * P4F2: Lighthouse 90+ - SEO Optimization
 *
 * Helper functions for SEO optimization
 */

import { Metadata } from 'next'

const SITE_NAME = '정치인 찾기 - PoliticianFinder'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://politician-finder.vercel.app'
const DEFAULT_DESCRIPTION = '대한민국 정치인 정보 검색 플랫폼. 정치인 이름, 정당, 지역으로 검색하고 의정 활동을 확인하세요.'

interface SEOConfig {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noindex?: boolean
}

/**
 * Generate metadata for pages
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = [],
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    noindex = false,
  } = config

  const fullTitle = `${title} | ${SITE_NAME}`
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const imageUrl = image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ko_KR',
      type,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

/**
 * Generate structured data for politician
 */
export function generatePoliticianStructuredData(politician: {
  id: string
  name: string
  party?: string
  position?: string
  imageUrl?: string
  description?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: politician.name,
    image: politician.imageUrl,
    description: politician.description,
    jobTitle: politician.position,
    memberOf: politician.party
      ? {
          '@type': 'Organization',
          name: politician.party,
        }
      : undefined,
    url: `${SITE_URL}/politicians/${politician.id}`,
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      // Add social media URLs when available
    ],
  }
}

/**
 * Generate WebSite structured data
 */
export function generateWebSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Sanitize text for meta tags
 */
export function sanitizeMetaText(text: string, maxLength: number = 160): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, maxLength)
    .concat(text.length > maxLength ? '...' : '')
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${cleanPath}`
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
