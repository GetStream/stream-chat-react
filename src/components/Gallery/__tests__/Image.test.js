/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import ImageComponent from '../Image';

const mockImageAssets = 'https://placeimg.com/640/480/any';

afterEach(cleanup); // eslint-disable-line

describe('Image', () => {
  it('should render component with default props', () => {
    const tree = renderer
      .create(<ImageComponent images={mockImageAssets} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  describe('it should prevent unsafe image uri protocols in the rendered image src', () => {
    it('should prevent javascript protocol in image src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ImageComponent image_url={xssJavascriptUri} />,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent javascript protocol in thumbnail src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ImageComponent thumb_url={xssJavascriptUri} />,
      );
      expect(getByTestId('image-test')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent dataUris in image src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(<ImageComponent image_url={xssDataUri} />);
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
    it('should prevent dataUris in thumb src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(<ImageComponent thumb_url={xssDataUri} />);
      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);
    const { getByTestId, getByTitle } = render(
      <ImageComponent images={mockImageAssets} />,
    );
    fireEvent.click(getByTestId('image-test'));

    await waitFor(() => {
      expect(getByTitle('Close (esc)')).toBeInTheDocument();
    });
  });
});
