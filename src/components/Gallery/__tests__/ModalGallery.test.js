import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModalGallery } from '../ModalGallery';
import { TranslationProvider } from '../../../context';
import { generateImageAttachment } from '../../../mock-builders';

const images = Array.from({ length: 3 }, generateImageAttachment);

const t = (val) => val;
const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
const getImages = () => screen.queryAllByTestId(BASE_IMAGE_TEST_ID);

const renderComponent = (props = {}) =>
  render(
    <TranslationProvider value={{ t }}>
      <ModalGallery {...props} />
    </TranslationProvider>,
  );

describe('ModalGallery', () => {
  it('uses BaseImage component to display images', () => {
    const { container } = renderComponent({ images });
    expect(container.querySelectorAll('.str-chat__base-image')).toHaveLength(
      images.length,
    );
  });
  it('displays image fallback on error', () => {
    const { container } = renderComponent({ images });
    const imageElements = getImages();
    act(() => {
      imageElements.forEach((element) => fireEvent.error(element));
    });

    const fallbacks = container.querySelectorAll('.str-chat__base-image--load-failed');
    expect(fallbacks).toHaveLength(images.length);
    fallbacks.forEach((fallback) => {
      expect(fallback.alt).toBe('');
    });
  });
});
