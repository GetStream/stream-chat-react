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
const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
const getImage = () => screen.queryByTestId(BASE_IMAGE_TEST_ID);

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

  it('should render an image fallback on load error', () => {
    const { container } = renderComponent(props);
    const img = getImage();

    fireEvent.error(img);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <img
          alt="alt"
          class="str-chat__base-image str-chat__base-image--load-failed"
          data-testid="str-chat__base-image"
          src="src"
        />
        <a
          aria-label="Attachment"
          class="str-chat__message-attachment-file--item-download"
          download=""
          href="src"
          target="_blank"
        >
          <svg
            class="str-chat__message-attachment-download-icon"
            data-testid="download"
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM13.45 10H10.55V13H8L12 17L16 13H13.45V10Z"
              fill="black"
            />
          </svg>
        </a>
      </div>
    `);
  });

  it('should reset error state on image src change', () => {
    const { container, rerender } = renderComponent(props);

    fireEvent.error(getImage());

    rerender(
      <TranslationProvider value={{ t }}>
        <BaseImage src={'new-src'} />
      </TranslationProvider>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <img
          class="str-chat__base-image"
          data-testid="str-chat__base-image"
          src="new-src"
        />
      </div>
    `);
  });

  it('should execute a custom onError callback on load error', () => {
    const onError = jest.fn();
    renderComponent({ ...props, onError });

    fireEvent.error(getImage());
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
