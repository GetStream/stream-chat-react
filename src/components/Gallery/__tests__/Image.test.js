import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import { ImageComponent } from '../Image';

import { ComponentProvider } from '../../../context/ComponentContext';

const mockImageAssets = 'https://placeimg.com/640/480/any';

describe('Image', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const tree = renderer
      .create(
        <ComponentProvider value={{}}>
          <ImageComponent images={mockImageAssets} />
        </ComponentProvider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  describe('it should prevent unsafe image uri protocols in the rendered image src', () => {
    it('should prevent javascript protocol in image src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ComponentProvider value={{}}>
          <ImageComponent image_url={xssJavascriptUri} />
        </ComponentProvider>,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssJavascriptUri);
    });
    it('should prevent javascript protocol in thumbnail src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ComponentProvider value={{}}>
          <ImageComponent thumb_url={xssJavascriptUri} />
        </ComponentProvider>,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssJavascriptUri);
    });
    it('should prevent dataUris in image src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(
        <ComponentProvider value={{}}>
          <ImageComponent image_url={xssDataUri} />
        </ComponentProvider>,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
    it('should prevent dataUris in thumb src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(
        <ComponentProvider value={{}}>
          <ImageComponent thumb_url={xssDataUri} />
        </ComponentProvider>,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);
    const { getByTestId, getByTitle } = render(
      <ComponentProvider value={{}}>
        <ImageComponent images={mockImageAssets} />
      </ComponentProvider>,
    );
    fireEvent.click(getByTestId('image-test'));

    await waitFor(() => {
      expect(getByTitle('Close')).toBeInTheDocument();
    });
  });
});
