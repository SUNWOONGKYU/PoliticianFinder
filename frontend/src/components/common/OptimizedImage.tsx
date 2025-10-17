/**
 * Optimized Image Component with Lazy Loading and Error Handling
 * P4F1: Frontend Performance Optimization
 *
 * Features:
 * - Lazy loading with Next.js Image optimization
 * - Error handling with fallback UI
 * - Loading states with skeleton
 * - Responsive sizing
 * - Performance monitoring
 */
'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  showLoader?: boolean;
  fallbackSrc?: string;
}

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 400,
  fill = false,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  sizes,
  showLoader = true,
  fallbackSrc = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    console.warn(`[OptimizedImage] Failed to load: ${imageSrc}`);
    setIsLoading(false);

    // Try fallback if not already using it
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    } else {
      setHasError(true);
    }

    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps: Partial<ImageProps> = {
    src: imageSrc,
    alt,
    quality,
    priority,
    placeholder,
    blurDataURL,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100'
    ),
  };

  if (fill) {
    imageProps.fill = true;
    imageProps.sizes = sizes || '100vw';
  } else {
    imageProps.width = width;
    imageProps.height = height;
    imageProps.sizes = sizes || `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`;
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={!fill ? { width, height } : undefined}
    >
      {isLoading && showLoader && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image {...(imageProps as ImageProps)} />
    </div>
  );
});

/**
 * Optimized Avatar Component
 * For user profile pictures with fallback initials
 */
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

const sizeMap = {
  sm: { class: 'w-8 h-8 text-sm', px: 32 },
  md: { class: 'w-12 h-12 text-base', px: 48 },
  lg: { class: 'w-16 h-16 text-lg', px: 64 },
  xl: { class: 'w-24 h-24 text-2xl', px: 96 },
};

export const OptimizedAvatar = React.memo<OptimizedAvatarProps>(function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  className,
}) {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = sizeMap[size];
  const fallbackContent = fallbackText || alt.charAt(0).toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold',
          sizeConfig.class,
          className
        )}
      >
        {fallbackContent}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeConfig.class, className)}>
      <Image
        src={src}
        alt={alt}
        width={sizeConfig.px}
        height={sizeConfig.px}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
});