import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Gallery } from '../Gallery';
import { GalleryUI } from '../GalleryUI';
import { TranslationProvider } from '../../../context';
import { mockTranslationContext } from '../../../mock-builders';

import type { GalleryItem } from '../GalleryContext';

const makeImageItem = (overrides: Partial<GalleryItem> = {}): GalleryItem =>
  ({
    fallback: 'test-image.png',
    image_url: 'http://test-image.jpg',
    localMetadata: { id: 'img-1' },
    type: 'image',
    ...overrides,
  }) as unknown as GalleryItem;

const makeVideoItem = (overrides: Record<string, unknown> = {}): GalleryItem =>
  ({
    asset_url: 'http://test-video.mp4',
    localMetadata: { id: 'vid-1' },
    thumb_url: 'http://test-thumb.jpg',
    title: 'test-video.mp4',
    type: 'video',
    ...overrides,
  }) as unknown as GalleryItem;

const renderGalleryUI = (items: GalleryItem[], initialIndex = 0) =>
  render(
    <TranslationProvider value={mockTranslationContext}>
      <Gallery GalleryUI={GalleryUI} initialIndex={initialIndex} items={items} />
    </TranslationProvider>,
  );

describe('GalleryUI', () => {
  describe('Image rendering', () => {
    it('should render current image using BaseImage', () => {
      const items = [makeImageItem({ image_url: 'http://my-image.jpg' })];

      renderGalleryUI(items);

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://my-image.jpg');
    });

    it('should use fallback as alt text for images', () => {
      const items = [makeImageItem({ fallback: 'my-fallback.png' })];

      renderGalleryUI(items);

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toHaveAttribute('alt', 'my-fallback.png');
    });
  });

  describe('Video rendering', () => {
    it('should render video thumbnail with play overlay', () => {
      const items = [makeVideoItem()];

      renderGalleryUI(items);

      const playButton = screen.getByLabelText('Play video');
      expect(playButton).toBeInTheDocument();
      expect(screen.getByTestId('str-chat__base-image')).toHaveAttribute(
        'src',
        'http://test-thumb.jpg',
      );
    });

    it('should show video player when play button is clicked', () => {
      const items = [makeVideoItem({ asset_url: 'http://video.mp4' })];

      const { container } = renderGalleryUI(items);

      act(() => {
        fireEvent.click(screen.getByLabelText('Play video'));
      });

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'http://video.mp4');
    });
  });

  describe('Navigation buttons', () => {
    it('should hide prev button on first item', () => {
      const items = [makeImageItem(), makeImageItem()];

      renderGalleryUI(items);

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should hide next button on last item', () => {
      const items = [makeImageItem(), makeImageItem()];

      renderGalleryUI(items, 1);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });

    it('should show both buttons in the middle', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items, 1);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should navigate forward when next button is clicked', () => {
      const items = [
        makeImageItem({ image_url: 'http://img0.jpg' }),
        makeImageItem({ image_url: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items);

      act(() => {
        fireEvent.click(screen.getByLabelText('Next image'));
      });

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toHaveAttribute('src', 'http://img1.jpg');
    });

    it('should navigate backward when prev button is clicked', () => {
      const items = [
        makeImageItem({ image_url: 'http://img0.jpg' }),
        makeImageItem({ image_url: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items, 1);

      act(() => {
        fireEvent.click(screen.getByLabelText('Previous image'));
      });

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toHaveAttribute('src', 'http://img0.jpg');
    });
  });

  describe('Position indicator', () => {
    it('should show position indicator for multiple items', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should not show position indicator for single item', () => {
      const items = [makeImageItem()];

      renderGalleryUI(items);

      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });

    it('should update position indicator on navigation', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items);

      act(() => {
        fireEvent.click(screen.getByLabelText('Next image'));
      });

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate forward with ArrowRight key', () => {
      const items = [
        makeImageItem({ image_url: 'http://img0.jpg' }),
        makeImageItem({ image_url: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items);

      act(() => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
      });

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toHaveAttribute('src', 'http://img1.jpg');
    });

    it('should navigate backward with ArrowLeft key', () => {
      const items = [
        makeImageItem({ image_url: 'http://img0.jpg' }),
        makeImageItem({ image_url: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items, 1);

      act(() => {
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
      });

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toHaveAttribute('src', 'http://img0.jpg');
    });
  });

  describe('Video pause on navigation', () => {
    it('should reset video play state when navigating to another item', () => {
      const items = [makeVideoItem(), makeImageItem()];

      const { container } = renderGalleryUI(items);

      // Start video
      act(() => {
        fireEvent.click(screen.getByLabelText('Play video'));
      });

      expect(container.querySelector('video')).toBeInTheDocument();

      // Navigate to next item
      act(() => {
        fireEvent.click(screen.getByLabelText('Next image'));
      });

      // Video should be gone, image should be shown
      expect(container.querySelector('video')).not.toBeInTheDocument();
    });
  });

  describe('ARIA labels', () => {
    it('should have aria-label on navigation buttons', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items, 1);

      expect(screen.getByLabelText('Previous image')).toHaveAttribute('type', 'button');
      expect(screen.getByLabelText('Next image')).toHaveAttribute('type', 'button');
    });

    it('should have aria-label on video play button', () => {
      const items = [makeVideoItem()];

      renderGalleryUI(items);

      expect(screen.getByLabelText('Play video')).toHaveAttribute('type', 'button');
    });
  });

  describe('CSS classes', () => {
    it('should use str-chat__gallery CSS classes', () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderGalleryUI(items);

      expect(container.querySelector('.str-chat__gallery')).toBeInTheDocument();
      expect(container.querySelector('.str-chat__gallery__main')).toBeInTheDocument();
      expect(container.querySelector('.str-chat__gallery__media')).toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__gallery__media--image'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__gallery__nav-button--next'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__gallery__position-indicator'),
      ).toBeInTheDocument();
    });

    it('should use video CSS class for video items', () => {
      const items = [makeVideoItem()];

      const { container } = renderGalleryUI(items);

      expect(
        container.querySelector('.str-chat__gallery__media--video'),
      ).toBeInTheDocument();
    });
  });
});
