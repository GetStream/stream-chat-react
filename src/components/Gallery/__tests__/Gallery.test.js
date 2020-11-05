/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getTestClientWithUser } from '../../../mock-builders';

import { Chat } from '../../Chat';
import Gallery from '../Gallery';

let chatClient;

const mockGalleryAssets = [
  { src: 'https://placeimg.com/640/480/any' },
  { src: 'https://placeimg.com/640/480/any' },
  { src: 'https://placeimg.com/640/480/any' },
  { src: 'https://placeimg.com/640/480/any' },
  { src: 'https://placeimg.com/640/480/any' },
  { src: 'https://placeimg.com/640/480/any' },
];

afterEach(cleanup); // eslint-disable-line

describe('Gallery', () => {
  it('should render component with default props', () => {
    const tree = renderer
      .create(<Gallery images={mockGalleryAssets.slice(0, 2)} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 3 images', () => {
    const tree = renderer
      .create(<Gallery images={mockGalleryAssets.slice(0, 3)} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 4 images', () => {
    const tree = renderer
      .create(<Gallery images={mockGalleryAssets.slice(0, 4)} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 6 images', () => {
    const tree = renderer
      .create(<Gallery images={mockGalleryAssets} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);

    const { getByTestId } = render(
      <Gallery images={mockGalleryAssets.slice(0, 1)} />,
    );
    fireEvent.click(getByTestId('gallery-image'));

    await waitFor(() => {
      expect(getByTestId('modal-image')).toBeInTheDocument();
    });
  });

  it('should display correct image count', async () => {
    chatClient = await getTestClientWithUser({ id: 'test' });
    const { getByText } = await render(
      <Chat client={chatClient}>
        <Gallery images={mockGalleryAssets} />,
      </Chat>,
    );
    await waitFor(() => {
      expect(getByText('3 more')).toBeInTheDocument();
    });
  });
});
