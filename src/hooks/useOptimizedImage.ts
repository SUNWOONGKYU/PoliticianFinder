// Optimized Image Loading Hook with Lazy Loading
import { useState, useEffect, useRef } from 'react';

interface UseOptimizedImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
}

export function useOptimizedImage({
  src,
  placeholder = '/images/placeholder.jpg',
  threshold = 0.1,
}: UseOptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the actual image
            const img = new Image();
            img.src = src;

            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };

            img.onerror = () => {
              setIsError(true);
              setIsLoading(false);
            };

            // Disconnect observer once image starts loading
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, placeholder, threshold]);

  return {
    imageSrc,
    isLoading,
    isError,
    imgRef,
  };
}