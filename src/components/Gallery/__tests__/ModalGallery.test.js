import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModalGallery } from '../../Attachment/ModalGallery';
import { TranslationProvider } from '../../../context';
import { mockTranslationContext } from '../../../mock-builders';

const makeImageItem = (overrides = {}) => ({
  fallback: 'test.png',
  image_url: 'http://test-image.jpg',
  localMetadata: { id: `img-${Math.random()}` },
  thumb_url: 'http://test-thumb.jpg',
  type: 'image',
  ...overrides,
});

const renderComponent = (props = {}) =>
  render(
    <TranslationProvider value={mockTranslationContext}>
      <ModalGallery items={[]} {...props} />
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
        makeImageItem({ image_url: 'http://img0.jpg' }),
        makeImageItem({ image_url: 'http://img1.jpg' }),
        makeImageItem({ image_url: 'http://img2.jpg' }),
      ];

      const { container } = renderComponent({ items });

      const thumbnails = container.querySelectorAll('.str-chat__modal-gallery__image');

      act(() => {
        fireEvent.click(thumbnails[1]);
      });

      await waitFor(() => {
        // The gallery should show position 2 / 3 (index 1)
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
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
  });

  describe('BaseImage error handling', () => {
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
  });
});
