import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Gallery } from '../Gallery';
import { GalleryUI } from '../GalleryUI';
import {
  MessageProvider,
  ModalContextProvider,
  TranslationProvider,
} from '../../../context';
import { mockTranslationContextValue } from '../../../mock-builders';

import type { GalleryProps } from '../Gallery';
import type { MessageContextValue, ModalContextValue } from '../../../context';
import type { GalleryItem } from '../GalleryContext';

const makeImageItem = (overrides: Partial<GalleryItem> = {}): GalleryItem =>
  ({
    alt: 'test-image.png',
    imageUrl: 'http://test-image.jpg',
    localMetadata: { id: 'img-1' },
    type: 'image',
    ...overrides,
  }) as unknown as GalleryItem;

const makeVideoItem = (overrides: Record<string, any> = {}): GalleryItem =>
  ({
    localMetadata: { id: 'vid-1' },
    title: 'test-video.mp4',
    type: 'video',
    videoThumbnailUrl: 'http://test-thumb.jpg',
    videoUrl: 'http://test-video.mp4',
    ...overrides,
  }) as unknown as GalleryItem;

const makeMessageContext = (
  overrides: Partial<MessageContextValue> = {},
): MessageContextValue =>
  ({
    isMyMessage: () => false,
    message: {
      created_at: new Date('2025-01-01T12:34:56.000Z'),
      user: { id: 'jenny', name: 'Jenny' },
    },
    ...overrides,
  }) as MessageContextValue;

const getSlideContainer = (container: HTMLElement) => {
  const slideContainer = container.querySelector('.str-chat__gallery__slide-container');

  expect(slideContainer).toBeInTheDocument();

  return slideContainer as HTMLDivElement;
};

const renderGalleryUI = (
  items: GalleryItem[],
  {
    galleryProps,
    initialIndex = 0,
    messageContext,
    modalContext,
  }: {
    galleryProps?: Partial<GalleryProps>;
    initialIndex?: number;
    messageContext?: MessageContextValue;
    modalContext?: ModalContextValue;
  } = {},
) => {
  let children = (
    <Gallery
      GalleryUI={GalleryUI}
      initialIndex={initialIndex}
      items={items}
      {...galleryProps}
    />
  );

  if (messageContext) {
    children = <MessageProvider value={messageContext}>{children}</MessageProvider>;
  }

  if (modalContext) {
    children = (
      <ModalContextProvider value={modalContext}>{children}</ModalContextProvider>
    );
  }

  return render(
    <TranslationProvider value={mockTranslationContextValue()}>
      {children}
    </TranslationProvider>,
  );
};

describe('GalleryUI', () => {
  describe('Image rendering', () => {
    it('should render current image using BaseImage', () => {
      const items = [makeImageItem({ imageUrl: 'http://my-image.jpg' })];

      renderGalleryUI(items);

      const img = screen.getByTestId('str-chat__base-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://my-image.jpg');
    });

    it('should use fallback as alt text for images', () => {
      const items = [makeImageItem({ alt: 'my-fallback.png' })];

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

    it('should show video player when play button is clicked', async () => {
      const items = [makeVideoItem({ videoUrl: 'http://video.mp4' })];

      const { container } = renderGalleryUI(items);

      act(() => {
        fireEvent.click(screen.getByLabelText('Play video'));
      });

      await waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('src', 'http://video.mp4');
      });
    });
  });

  describe('Navigation buttons', () => {
    it('should hide prev button on first item', () => {
      const items = [makeImageItem(), makeImageItem()];

      renderGalleryUI(items);

      const prevButton = screen.getByLabelText('Previous image');
      expect(prevButton).toBeDisabled();
      expect(
        prevButton.closest('.str-chat__gallery__nav-button--hidden'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).not.toBeDisabled();
    });

    it('should hide next button on last item', () => {
      const items = [makeImageItem(), makeImageItem()];

      renderGalleryUI(items, { initialIndex: 1 });

      expect(screen.getByLabelText('Previous image')).not.toBeDisabled();
      const nextButton = screen.getByLabelText('Next image');
      expect(nextButton).toBeDisabled();
      expect(
        nextButton.closest('.str-chat__gallery__nav-button--hidden'),
      ).toBeInTheDocument();
    });

    it('should show both buttons in the middle', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items, { initialIndex: 1 });

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should navigate forward when next button is clicked', () => {
      const items = [
        makeImageItem({ imageUrl: 'http://img0.jpg' }),
        makeImageItem({ imageUrl: 'http://img1.jpg' }),
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
        makeImageItem({ imageUrl: 'http://img0.jpg' }),
        makeImageItem({ imageUrl: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items, { initialIndex: 1 });

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

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should not show position indicator for single item', () => {
      const items = [makeImageItem()];

      renderGalleryUI(items);

      expect(
        document.querySelector('.str-chat__gallery__position-indicator'),
      ).not.toBeInTheDocument();
    });

    it('should update position indicator on navigation', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      renderGalleryUI(items);

      act(() => {
        fireEvent.click(screen.getByLabelText('Next image'));
      });

      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
  });

  describe('Header metadata and actions', () => {
    it('should render sender metadata in the header when message context is available', () => {
      const items = [makeImageItem({ title: 'beach.png' })];

      const { container } = renderGalleryUI(items, {
        messageContext: makeMessageContext({ isMyMessage: () => true }),
      });

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(container.querySelector('.str-chat__gallery__timestamp')).toHaveAttribute(
        'datetime',
        '2025-01-01T12:34:56.000Z',
      );
    });

    it('should render a download action for the current item', () => {
      const items = [
        makeImageItem({
          imageUrl: 'https://example.com/download-image.jpg',
          title: 'beach.png',
        }),
      ];

      renderGalleryUI(items);

      const downloadLink = screen.getByLabelText('Download attachment');
      expect(downloadLink).toHaveAttribute('download');
      expect(downloadLink).toHaveAttribute(
        'href',
        'https://example.com/download-image.jpg',
      );
    });

    it('should render a close action when the gallery is shown inside a modal', () => {
      const close = vi.fn();
      const items = [makeImageItem()];

      renderGalleryUI(items, { modalContext: { close } });

      fireEvent.click(screen.getByTitle('Close'));
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Background click closing', () => {
    it('should close when the empty gallery background is clicked by default', () => {
      const close = vi.fn();
      const items = [makeImageItem()];

      const { container } = renderGalleryUI(items, { modalContext: { close } });

      fireEvent.click(getSlideContainer(container));

      expect(close).toHaveBeenCalledTimes(1);
    });

    it('should not close when the current media is clicked', () => {
      const close = vi.fn();
      const items = [makeImageItem()];

      renderGalleryUI(items, { modalContext: { close } });

      fireEvent.click(screen.getByTestId('str-chat__base-image'));

      expect(close).not.toHaveBeenCalled();
    });

    it('should not close when closeOnBackgroundClick is disabled', () => {
      const close = vi.fn();
      const items = [makeImageItem()];

      const { container } = renderGalleryUI(items, {
        galleryProps: { closeOnBackgroundClick: false },
        modalContext: { close },
      });

      fireEvent.click(getSlideContainer(container));

      expect(close).not.toHaveBeenCalled();
    });

    it('should ignore the next click after a swipe gesture', () => {
      const close = vi.fn();
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      const { container } = renderGalleryUI(items, { modalContext: { close } });
      const slideContainer = getSlideContainer(container);

      fireEvent.touchStart(slideContainer, {
        touches: [{ clientX: 180, clientY: 100 }],
      });
      fireEvent.touchMove(slideContainer, {
        touches: [{ clientX: 80, clientY: 100 }],
      });
      fireEvent.touchEnd(slideContainer);
      fireEvent.click(slideContainer);

      expect(close).not.toHaveBeenCalled();

      fireEvent.click(slideContainer);

      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate forward with ArrowRight key', () => {
      const items = [
        makeImageItem({ imageUrl: 'http://img0.jpg' }),
        makeImageItem({ imageUrl: 'http://img1.jpg' }),
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
        makeImageItem({ imageUrl: 'http://img0.jpg' }),
        makeImageItem({ imageUrl: 'http://img1.jpg' }),
      ];

      renderGalleryUI(items, { initialIndex: 1 });

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

      renderGalleryUI(items, { initialIndex: 1 });

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
      expect(container.querySelector('.str-chat__gallery__header')).toBeInTheDocument();
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
