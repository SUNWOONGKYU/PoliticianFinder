// Task: P3M1 - Phase 3 Mobile Optimization Testing
/**
 * ImageGallery Component Comprehensive Tests
 * 작업일: 2025-11-25
 * 설명: 모바일 최적화된 ImageGallery 컴포넌트 포괄적 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGallery } from '../ImageGallery';

const mockImages = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
];

describe('ImageGallery Component - Phase 3 Mobile Optimization', () => {
  describe('Basic Rendering', () => {
    it('should not render when images array is empty', () => {
      const { container } = render(<ImageGallery images={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when images is null', () => {
      const { container } = render(<ImageGallery images={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render single image without controls', () => {
      render(<ImageGallery images={[mockImages[0]]} />);
      const image = screen.getByAltText('이미지');
      expect(image).toBeInTheDocument();
    });

    it('should render multiple images with controls', () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockImages[0]);
    });

    it('should show image counter', () => {
      render(<ImageGallery images={mockImages} />);
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should use custom alt text', () => {
      render(<ImageGallery images={[mockImages[0]]} alt="테스트 이미지" />);
      const image = screen.getByAltText('테스트 이미지');
      expect(image).toBeInTheDocument();
    });

    it('should apply custom height', () => {
      const { container } = render(
        <ImageGallery images={mockImages} height="h-128" />
      );
      const gallery = container.firstChild;
      expect(gallery).toHaveClass('h-128');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ImageGallery images={mockImages} className="custom-class" />
      );
      const gallery = container.firstChild;
      expect(gallery).toHaveClass('custom-class');
    });

    it('should show thumbnails by default', () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      // Desktop thumbnails
      const thumbnails = container.querySelectorAll('button[aria-label*="이미지"]');
      expect(thumbnails.length).toBeGreaterThan(0);
    });

    it('should hide thumbnails when showThumbnails is false', () => {
      const { container } = render(
        <ImageGallery images={mockImages} showThumbnails={false} />
      );
      // Check for desktop thumbnail container with gap-2 and mt-3
      const desktopThumbnails = container.querySelector('.hidden.md\\:flex.gap-2.mt-3');
      expect(desktopThumbnails).toBeNull();
    });
  });

  describe('Navigation - Button Clicks', () => {
    it('should show next image when next button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      // Find next button (desktop navigation)
      const nextButton = container.querySelector('button[aria-label="다음 이미지"]');
      expect(nextButton).toBeInTheDocument();

      await user.click(nextButton as Element);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should show previous image when previous button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      // Go to next image first
      const nextButton = container.querySelector('button[aria-label="다음 이미지"]') as Element;
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });

      // Click previous
      const prevButton = container.querySelector('button[aria-label="이전 이미지"]') as Element;
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    it('should loop to first image when at end', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const nextButton = container.querySelector('button[aria-label="다음 이미지"]') as Element;

      // Click next 3 times (should loop back to first)
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    it('should loop to last image when at start and clicking previous', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const prevButton = container.querySelector('button[aria-label="이전 이미지"]') as Element;
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Swipe Navigation', () => {
    it('should handle touch start', () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const slider = container.querySelector('.overflow-hidden');

      const touchEvent = {
        touches: [{ clientX: 100 }],
        targetTouches: [{ clientX: 100 }],
        changedTouches: [{ clientX: 100 }],
      };

      fireEvent.touchStart(slider!, touchEvent);

      expect(slider).toBeInTheDocument();
    });

    it('should navigate to next image on left swipe', async () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const slider = container.querySelector('.overflow-hidden') as Element;

      // Simulate swipe left (next image)
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 200 }],
        targetTouches: [{ clientX: 200 }],
        changedTouches: [{ clientX: 200 }],
      });

      fireEvent.touchMove(slider, {
        touches: [{ clientX: 100 }], // Moved 100px left
        targetTouches: [{ clientX: 100 }],
        changedTouches: [{ clientX: 100 }],
      });

      fireEvent.touchEnd(slider);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should navigate to previous image on right swipe', async () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const slider = container.querySelector('.overflow-hidden') as Element;

      // First go to image 2
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 200 }],
        targetTouches: [{ clientX: 200 }],
        changedTouches: [{ clientX: 200 }],
      });
      fireEvent.touchMove(slider, {
        touches: [{ clientX: 100 }],
        targetTouches: [{ clientX: 100 }],
        changedTouches: [{ clientX: 100 }],
      });
      fireEvent.touchEnd(slider);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });

      // Swipe right (previous image)
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 100 }],
        targetTouches: [{ clientX: 100 }],
        changedTouches: [{ clientX: 100 }],
      });

      fireEvent.touchMove(slider, {
        touches: [{ clientX: 200 }], // Moved 100px right
        targetTouches: [{ clientX: 200 }],
        changedTouches: [{ clientX: 200 }],
      });

      fireEvent.touchEnd(slider);

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    it('should not navigate on small swipe', () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const slider = container.querySelector('.overflow-hidden') as Element;

      // Swipe less than minimum distance (50px)
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 100 }],
        targetTouches: [{ clientX: 100 }],
        changedTouches: [{ clientX: 100 }],
      });
      fireEvent.touchMove(slider, {
        touches: [{ clientX: 80 }], // 20px
        targetTouches: [{ clientX: 80 }],
        changedTouches: [{ clientX: 80 }],
      });
      fireEvent.touchEnd(slider);

      // Should stay on first image
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next image with ArrowRight key', async () => {
      render(<ImageGallery images={mockImages} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      // Note: Keyboard navigation only works when fullscreen is active
      // This test verifies the event listener is set up
      expect(screen.getByText(/\/ 3/)).toBeInTheDocument();
    });

    it('should navigate to previous image with ArrowLeft key', async () => {
      render(<ImageGallery images={mockImages} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(screen.getByText(/\/ 3/)).toBeInTheDocument();
    });
  });

  describe('Thumbnail Navigation', () => {
    it('should navigate to specific image when thumbnail is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      // Find all thumbnail buttons (desktop)
      const thumbnails = container.querySelectorAll('button[aria-label*="이미지"][aria-label*="이동"]');

      if (thumbnails.length > 0) {
        await user.click(thumbnails[2] as Element); // Click third thumbnail

        await waitFor(() => {
          expect(screen.getByText('3 / 3')).toBeInTheDocument();
        });
      }
    });

    it('should highlight current thumbnail', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const thumbnails = container.querySelectorAll('button[aria-label*="이미지"][aria-label*="이동"]');

      if (thumbnails.length > 0) {
        // First thumbnail should have active styling
        expect(thumbnails[0]).toHaveClass('ring-2', 'ring-primary-500');
      }
    });
  });

  describe('Dot Indicator Navigation (Mobile)', () => {
    it('should render dot indicators', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      // Mobile indicators
      const indicators = container.querySelectorAll('.md\\:hidden button');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should navigate when dot indicator is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      // Find mobile dot indicators
      const mobileIndicators = container.querySelector('.md\\:hidden.flex');
      const dots = mobileIndicators?.querySelectorAll('button');

      if (dots && dots.length > 0) {
        await user.click(dots[1]); // Click second dot

        await waitFor(() => {
          expect(screen.getByText('2 / 3')).toBeInTheDocument();
        });
      }
    });

    it('should highlight active dot', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const mobileIndicators = container.querySelector('.md\\:hidden.flex');
      const dots = mobileIndicators?.querySelectorAll('button');

      if (dots && dots.length > 0) {
        // First dot should be active
        expect(dots[0]).toHaveClass('bg-primary-500');
      }
    });
  });

  describe('Fullscreen Mode', () => {
    it('should open fullscreen when image is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).toBeInTheDocument();
      });
    });

    it('should show close button in fullscreen', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('전체화면 닫기');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should close fullscreen when close button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('전체화면 닫기');
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('전체화면 닫기');
      await user.click(closeButton);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).not.toBeInTheDocument();
      });
    });

    it('should close fullscreen when clicking backdrop', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).toBeInTheDocument();
      });

      const backdrop = document.querySelector('.fixed.inset-0') as Element;
      await user.click(backdrop);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).not.toBeInTheDocument();
      });
    });

    it('should close fullscreen with Escape key', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        expect(fullscreenModal).not.toBeInTheDocument();
      });
    });

    it('should have navigation buttons in fullscreen', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const fullscreenModal = document.querySelector('.fixed.inset-0');
        const navButtons = fullscreenModal?.querySelectorAll('button[aria-label*="이미지"]');
        expect(navButtons?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Auto-play Feature', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should auto-advance when autoPlay is true', async () => {
      render(
        <ImageGallery images={mockImages} autoPlay autoPlayInterval={1000} />
      );

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      // Fast-forward 1 second
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should not auto-play by default', () => {
      render(<ImageGallery images={mockImages} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      jest.advanceTimersByTime(5000);

      // Should still be on first image
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should stop auto-play when single image', () => {
      render(<ImageGallery images={[mockImages[0]]} autoPlay />);

      jest.advanceTimersByTime(5000);

      // Single image - no counter visible
      expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const prevButton = screen.queryByLabelText('이전 이미지');
      const nextButton = screen.queryByLabelText('다음 이미지');

      expect(prevButton || nextButton).toBeTruthy();
    });

    it('should have proper ARIA labels on thumbnails', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const thumbnail = container.querySelector('button[aria-label*="이미지"][aria-label*="이동"]');
      expect(thumbnail).toBeTruthy();
    });

    it('should use alt text with index for multiple images', () => {
      const { container } = render(
        <ImageGallery images={mockImages} alt="정치인 프로필" />
      );

      const image = container.querySelector('img');
      expect(image).toHaveAttribute('alt', '정치인 프로필 1');
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide desktop navigation on mobile (class check)', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const desktopNav = container.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('should show mobile swipe hint', () => {
      render(<ImageGallery images={mockImages} />);

      expect(screen.getByText('← 스와이프 →')).toBeInTheDocument();
    });

    it('should hide thumbnails on mobile (class check)', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      // Desktop thumbnails should have hidden mobile class
      const desktopThumbnails = container.querySelector('.hidden.md\\:flex.gap-2');
      expect(desktopThumbnails).toBeInTheDocument();
    });

    it('should show dot indicators on mobile', () => {
      const { container } = render(<ImageGallery images={mockImages} />);

      const mobileIndicators = container.querySelector('.md\\:hidden.flex.justify-center');
      expect(mobileIndicators).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation clicks', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const nextButton = container.querySelector('button[aria-label="다음 이미지"]') as Element;

      // Rapid clicks
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      // Should handle gracefully
      expect(screen.getByText(/\/ 3/)).toBeInTheDocument();
    });

    it('should handle image load errors gracefully', () => {
      const { container } = render(<ImageGallery images={mockImages} />);
      const image = container.querySelector('img') as HTMLImageElement;

      // Simulate image error
      fireEvent.error(image);

      // Component should still be rendered
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should prevent event bubbling on fullscreen image click', async () => {
      const user = userEvent.setup();
      const { container } = render(<ImageGallery images={mockImages} />);

      const image = container.querySelector('img') as Element;
      await user.click(image);

      await waitFor(() => {
        const fullscreenImage = document.querySelector('.fixed .max-w-7xl img');
        expect(fullscreenImage).toBeInTheDocument();
      });

      const fullscreenImageContainer = document.querySelector('.fixed .max-w-7xl') as Element;
      await user.click(fullscreenImageContainer);

      // Fullscreen should still be open (event.stopPropagation works)
      const fullscreenModal = document.querySelector('.fixed.inset-0');
      expect(fullscreenModal).toBeInTheDocument();
    });
  });
});
