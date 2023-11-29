import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BaseImage } from '../BaseImage';
import { TranslationProvider } from '../../../context';

const props = {
  alt: 'alt',
  src: 'src',
};
const t = (val) => val;
const FALLBACK_TEST_ID = 'str-chat__image-fallback';
const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
const getImage = () => screen.queryByTestId(BASE_IMAGE_TEST_ID);
const getFallback = () => screen.queryByTestId(FALLBACK_TEST_ID);

const renderComponent = (props = {}) =>
  render(
    <TranslationProvider value={{ t }}>
      <BaseImage {...props} />
    </TranslationProvider>,
  );
describe('BaseImage', () => {
  it('should render an image', () => {
    const { container } = renderComponent(props);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <img
          alt="alt"
          class="str-chat__base-image"
          data-testid="str-chat__base-image"
          src="src"
        />
      </div>
    `);
  });
  it('should render an image with default and custom classes', () => {
    const { container } = renderComponent({ ...props, className: 'custom' });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <img
          alt="alt"
          class="custom str-chat__base-image"
          data-testid="str-chat__base-image"
          src="src"
        />
      </div>
    `);
  });
  it('should render an image fallback when missing src', () => {
    renderComponent();
    expect(screen.queryByTestId(FALLBACK_TEST_ID)).toBeInTheDocument();
  });

  it('should forward img props to fallback', () => {
    const props = { alt: 'alt', title: 'title' };
    const ImageFallback = (props) => <div>{JSON.stringify(props)}</div>;
    renderComponent({ ...props, ImageFallback });
    expect(screen.getByText(JSON.stringify(props))).toBeInTheDocument();
  });

  it('should apply img title to fallback root div title', () => {
    const props = { alt: 'alt', title: 'title' };
    renderComponent(props);
    expect(screen.queryByTitle(props.title)).toBeInTheDocument();
  });

  it('should apply img alt to fallback root div title if img title is falsy', () => {
    const props = { alt: 'alt' };
    renderComponent({ alt: 'alt' });
    expect(screen.queryByTitle(props.alt)).toBeInTheDocument();
  });

  it('should render an image fallback on load error', () => {
    renderComponent(props);
    const img = getImage();
    expect(getImage()).toBeInTheDocument();
    expect(getFallback()).not.toBeInTheDocument();

    fireEvent.error(img);
    expect(img).not.toBeInTheDocument();
    expect(getFallback()).toBeInTheDocument();
  });

  it('should reset error state on image src change', () => {
    const { rerender } = renderComponent(props);

    fireEvent.error(getImage());

    rerender(
      <TranslationProvider value={{ t }}>
        <BaseImage src={'new-src'} />
      </TranslationProvider>,
    );
    expect(getImage()).toBeInTheDocument();
    expect(getFallback()).not.toBeInTheDocument();
  });

  it('should execute a custom onError callback on load error', () => {
    const onError = jest.fn();
    renderComponent({ ...props, onError });

    fireEvent.error(getImage());
    expect(onError).toHaveBeenCalledTimes(1);
  });
  it('should render a custom image fallback on load error', () => {
    const testId = 'custom-fallback';
    const ImageFallback = () => <div data-testid={testId}>Custom Fallback</div>;
    renderComponent({ ...props, ImageFallback });

    fireEvent.error(getImage());
    expect(screen.queryByTestId(testId)).toBeInTheDocument();
    expect(getImage()).not.toBeInTheDocument();
    expect(getFallback()).not.toBeInTheDocument();
  });
});
