import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { BaseImage } from '../BaseImage';
import { TranslationProvider } from '../../../context';
import { ComponentProvider } from '../../../context/ComponentContext';
import { mockTranslationContext } from '../../../mock-builders';

const props = {
  alt: 'alt',
  src: 'src',
};
const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
const PLACEHOLDER_TEST_ID = 'str-chat__base-image-placeholder';
const getImage = () => screen.queryByTestId(BASE_IMAGE_TEST_ID);

const renderComponent = (props = {}) =>
  render(
    <TranslationProvider value={mockTranslationContext}>
      <ComponentProvider value={{}}>
        <BaseImage {...props} />
      </ComponentProvider>
    </TranslationProvider>,
  );

describe('BaseImage', () => {
  it('should render an image', () => {
    renderComponent(props);
    const img = getImage();
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('alt', 'alt');
    expect(img).toHaveAttribute('src', 'src');
    expect(img).toHaveClass('str-chat__base-image');
  });

  it('should render an image with default and custom classes', () => {
    renderComponent({ ...props, className: 'custom' });
    const img = getImage();
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('custom');
    expect(img).toHaveClass('str-chat__base-image');
  });

  it('should render an image placeholder on load error', () => {
    renderComponent(props);
    const img = getImage();

    fireEvent.error(img);

    // After error, image is replaced by ImagePlaceholder
    expect(getImage()).not.toBeInTheDocument();
    const placeholder = screen.getByTestId(PLACEHOLDER_TEST_ID);
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass('str-chat__image-placeholder');
    expect(placeholder).toHaveClass('str-chat__base-image--load-failed');
  });

  it('should not show download button on error by default', () => {
    renderComponent(props);

    fireEvent.error(getImage());

    // showDownloadButtonOnError defaults to false
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should show download button on error when showDownloadButtonOnError is true', () => {
    renderComponent({ ...props, showDownloadButtonOnError: true });

    fireEvent.error(getImage());

    const downloadLink = screen.queryByRole('link');
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', 'src');
  });

  it('should reset error state on image src change', () => {
    const { rerender } = renderComponent(props);

    fireEvent.error(getImage());

    // After error, placeholder is shown
    expect(getImage()).not.toBeInTheDocument();
    expect(screen.getByTestId(PLACEHOLDER_TEST_ID)).toBeInTheDocument();

    rerender(
      <TranslationProvider value={mockTranslationContext}>
        <ComponentProvider value={{}}>
          <BaseImage src={'new-src'} />
        </ComponentProvider>
      </TranslationProvider>,
    );

    // After src change, image is shown again
    const img = getImage();
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'new-src');
    expect(img).toHaveClass('str-chat__base-image');
  });

  it('should execute a custom onError callback on load error', () => {
    const onError = vi.fn();
    renderComponent({ ...props, onError });

    fireEvent.error(getImage());
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
