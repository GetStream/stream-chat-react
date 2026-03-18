import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModalGallery } from '../../Attachment/ModalGallery';
import { TranslationProvider } from '../../../context';
import { ComponentProvider } from '../../../context/ComponentContext';
import { mockTranslationContext } from '../../../mock-builders';

const makeImageItem = (overrides = {}) => ({
  fallback: 'test.png',
  imageUrl: 'http://test-image.jpg',
  localMetadata: { id: `img-${Math.random()}` },
  type: 'image',
  ...overrides,
});

const renderComponent = (props = {}, componentOverrides = {}) =>
  render(
    <TranslationProvider value={mockTranslationContext}>
      <ComponentProvider
        value={{
          Modal: ({ children, className, open }) =>
            open ? <div className={className}>{children}</div> : null,
          ...componentOverrides,
        }}
      >
        <ModalGallery items={[]} {...props} />
      </ComponentProvider>
    </TranslationProvider>,
  );

describe('ModalGallery', () => {
  describe('Thumbnail grid rendering', () => {
    it('should render thumbnail grid with images', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      expect(container.querySelector('.str-chat__modal-gallery')).toBeInTheDocument();
      expect(container.querySelectorAll('.str-chat__modal-gallery__image')).toHaveLength(
        3,
      );
    });

    it('should render BaseImage components for thumbnails', () => {
      const items = [makeImageItem(), makeImageItem()];

      renderComponent({ items });

      expect(screen.getAllByTestId('str-chat__base-image')).toHaveLength(2);
    });

    it('should forward image sizing props to BaseImage', () => {
      const imageRef = React.createRef();
      const items = [
        makeImageItem({
          ref: imageRef,
          style: { '--original-height': 240, '--original-width': 320 },
        }),
      ];

      renderComponent({ items });

      const image = screen.getByTestId('str-chat__base-image');

      expect(image).toHaveStyle({
        '--original-height': '240',
        '--original-width': '320',
      });
      expect(imageRef.current).toBe(image);
    });

    it('should forward supported custom BaseImage props from the gallery item', () => {
      const receivedProps = [];
      const items = [makeImageItem({ showDownloadButtonOnError: true })];
      const CustomBaseImage = (props) => {
        receivedProps.push(props);

        return <div data-testid='custom-base-image' />;
      };

      renderComponent({ items }, { BaseImage: CustomBaseImage });

      expect(screen.getByTestId('custom-base-image')).toBeInTheDocument();
      expect(receivedProps[0]).toMatchObject({
        alt: 'User uploaded content',
        showDownloadButtonOnError: true,
        src: 'http://test-image.jpg',
      });
      expect(receivedProps[0]).not.toHaveProperty('localMetadata');
    });

    it('should apply --two-images modifier for 2 images', () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      expect(
        container.querySelector('.str-chat__modal-gallery--two-images'),
      ).toBeInTheDocument();
    });

    it('should apply --three-images modifier for 3 images', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      expect(
        container.querySelector('.str-chat__modal-gallery--three-images'),
      ).toBeInTheDocument();
    });

    it('should not apply modifier classes for 1 image', () => {
      const items = [makeImageItem()];

      const { container } = renderComponent({ items });

      expect(
        container.querySelector('.str-chat__modal-gallery--two-images'),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__modal-gallery--three-images'),
      ).not.toBeInTheDocument();
    });

    it('should not apply modifier classes for 4+ images', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      expect(
        container.querySelector('.str-chat__modal-gallery--two-images'),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__modal-gallery--three-images'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Overflow placeholder', () => {
    it('should show +N placeholder when more than 4 images', () => {
      const items = Array.from({ length: 6 }, () => makeImageItem());

      const { container } = renderComponent({ items });

      const placeholder = container.querySelector(
        '.str-chat__modal-gallery__placeholder',
      );
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('+2');
    });

    it('should show max 4 thumbnails', () => {
      const items = Array.from({ length: 6 }, () => makeImageItem());

      const { container } = renderComponent({ items });

      expect(container.querySelectorAll('.str-chat__modal-gallery__image')).toHaveLength(
        4,
      );
    });

    it('should not show placeholder when 4 or fewer images', () => {
      const items = [makeImageItem(), makeImageItem(), makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      expect(
        container.querySelector('.str-chat__modal-gallery__placeholder'),
      ).not.toBeInTheDocument();
    });
  });

  describe('non-interactive mode', () => {
    it('should render static items without opening modal on click', () => {
      const items = [makeImageItem()];

      const { container } = renderComponent({ interactive: false, items });

      expect(
        screen.getByTestId('str-chat__modal-gallery__static-item'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Open image in gallery/i }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('str-chat__base-image'));

      expect(container.querySelector('.str-chat__gallery-modal')).toBeNull();
    });
  });

  describe('Modal behavior', () => {
    it('should open modal when thumbnail is clicked', async () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      act(() => {
        fireEvent.click(thumbnails[0]);
      });

      await waitFor(() => {
        expect(container.querySelector('.str-chat__gallery-modal')).toBeInTheDocument();
      });
    });

    it('should pass correct initialIndex to Gallery when clicking second thumbnail', async () => {
      const items = [
        makeImageItem({ imageUrl: 'http://img0.jpg' }),
        makeImageItem({ imageUrl: 'http://img1.jpg' }),
        makeImageItem({ imageUrl: 'http://img2.jpg' }),
      ];

      const { container } = renderComponent({ items });

      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      act(() => {
        fireEvent.click(thumbnails[1]);
      });

      await waitFor(() => {
        // The gallery should show position 2 of 3 (index 1)
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('should have aria-labels on thumbnail buttons', () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      thumbnails.forEach((thumb) => {
        expect(thumb).toHaveAttribute('aria-label');
        expect(thumb).toHaveAttribute('type', 'button');
      });
    });

    it('should close the modal when the empty gallery background is clicked by default', async () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });
      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      act(() => {
        fireEvent.click(thumbnails[0]);
      });

      const slideContainer = await waitFor(() => {
        expect(container.querySelector('.str-chat__gallery-modal')).toBeInTheDocument();
        const element = container.querySelector('.str-chat__gallery__slide-container');
        expect(element).toBeInTheDocument();
        return element;
      });

      act(() => {
        fireEvent.click(slideContainer);
      });

      await waitFor(() => {
        expect(
          container.querySelector('.str-chat__gallery-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('should keep the modal open when closeOnBackgroundClick is disabled', async () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ closeOnBackgroundClick: false, items });
      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      act(() => {
        fireEvent.click(thumbnails[0]);
      });

      const slideContainer = await waitFor(() => {
        expect(container.querySelector('.str-chat__gallery-modal')).toBeInTheDocument();
        const element = container.querySelector('.str-chat__gallery__slide-container');
        expect(element).toBeInTheDocument();
        return element;
      });

      act(() => {
        fireEvent.click(slideContainer);
      });

      expect(container.querySelector('.str-chat__gallery-modal')).toBeInTheDocument();
    });
  });

  describe('BaseImage error handling', () => {
    it('should render the loading overlay until the image loads', () => {
      const items = [makeImageItem()];

      renderComponent({ items });

      expect(
        screen.getByTestId('str-chat__modal-gallery__image-loading-overlay'),
      ).toBeInTheDocument();

      fireEvent.load(screen.getByTestId('str-chat__base-image'));

      expect(
        screen.queryByTestId('str-chat__modal-gallery__image-loading-overlay'),
      ).not.toBeInTheDocument();
    });

    it('should display image fallback on error', () => {
      const items = [makeImageItem(), makeImageItem()];

      const { container } = renderComponent({ items });

      const imageElements = screen.getAllByTestId('str-chat__base-image');

      act(() => {
        imageElements.forEach((element) => fireEvent.error(element));
      });

      const fallbacks = container.querySelectorAll('.str-chat__base-image--load-failed');
      expect(fallbacks).toHaveLength(items.length);
    });

    it('should render the retry indicator and suppress the legacy download fallback on error', () => {
      const items = [makeImageItem()];

      const { container } = renderComponent({ items });

      fireEvent.error(screen.getByTestId('str-chat__base-image'));

      expect(
        screen.getByTestId('str-chat__modal-gallery__image-load-failed-overlay'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__message-attachment-file--item-download'),
      ).not.toBeInTheDocument();
    });

    it('should retry loading the image instead of opening the modal when the thumbnail is in error state', async () => {
      const items = [makeImageItem()];

      const { container } = renderComponent({ items });
      const image = screen.getByTestId('str-chat__base-image');

      fireEvent.error(image);
      fireEvent.click(container.querySelector('.str-chat__modal-gallery__image'));

      const retriedImage = screen.getByTestId('str-chat__base-image');

      expect(screen.queryByTitle('Close')).not.toBeInTheDocument();
      expect(
        screen.getByTestId('str-chat__modal-gallery__image-loading-overlay'),
      ).toBeInTheDocument();
      expect(retriedImage).not.toBe(image);
      expect(retriedImage).toHaveAttribute('src', 'http://test-image.jpg');

      fireEvent.load(retriedImage);
      fireEvent.click(container.querySelector('.str-chat__modal-gallery__image'));

      await waitFor(() => {
        expect(container.querySelector('.str-chat__gallery-modal')).toBeInTheDocument();
      });
    });
  });
});
