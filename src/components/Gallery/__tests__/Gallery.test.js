import React from 'react';
import { nanoid } from 'nanoid';
import renderer from 'react-test-renderer';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getTestClientWithUser } from '../../../mock-builders';

import { Chat } from '../../Chat';
import { Gallery } from '../Gallery';

import { ComponentProvider } from '../../../context/ComponentContext';

let chatClient;

const mockGalleryAssets = [
  {
    original: 'https://placeimg.com/640/480/any',
    originalAlt: 'User uploaded content',
    src: 'https://placeimg.com/640/480/any',
  },
  {
    original: 'https://placeimg.com/640/480/any',
    originalAlt: 'User uploaded content',
    src: 'https://placeimg.com/640/480/any',
  },
  {
    original: 'https://placeimg.com/640/480/any',
    originalAlt: 'User uploaded content',
    src: 'https://placeimg.com/640/480/any',
  },
  {
    original: 'https://placeimg.com/640/480/any',
    originalAlt: 'User uploaded content',
    src: 'https://placeimg.com/640/480/any',
  },
  {
    original: 'https://placeimg.com/640/480/any',
    originalAlt: 'User uploaded content',
    src: 'https://placeimg.com/640/480/any',
  },
];

describe('Gallery', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const tree = renderer
      .create(
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets.slice(0, 2)} />
        </ComponentProvider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 3 images', () => {
    const tree = renderer
      .create(
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets.slice(0, 3)} />
        </ComponentProvider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 4 images', () => {
    const tree = renderer
      .create(
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets.slice(0, 4)} />
        </ComponentProvider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with 5 images', () => {
    const tree = renderer
      .create(
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets} />
        </ComponentProvider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);

    const { getByTestId, getByTitle } = render(
      <ComponentProvider value={{}}>
        <Gallery images={mockGalleryAssets.slice(0, 1)} />
      </ComponentProvider>,
    );

    fireEvent.click(getByTestId('gallery-image'));

    await waitFor(() => {
      expect(getByTitle('Close')).toBeInTheDocument();
    });
  });

  it('should display correct image count', async () => {
    chatClient = await getTestClientWithUser({ id: 'test' });
    const { getByText } = await render(
      <Chat client={chatClient}>
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets} />
        </ComponentProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByText('1 more')).toBeInTheDocument();
    });
  });

  it('should open the modal with image displayed under the "X more" overlay if clicked on the overlay', async () => {
    chatClient = await getTestClientWithUser({ id: 'test' });
    const { container, getByText } = render(
      <Chat client={chatClient}>
        <ComponentProvider value={{}}>
          <Gallery images={mockGalleryAssets} />
        </ComponentProvider>
      </Chat>,
    );

    const overlay = await waitFor(() => getByText('1 more'));
    act(() => {
      fireEvent.click(overlay);
    });

    await waitFor(() => {
      expect(container.querySelector('.image-gallery-index')).toHaveTextContent('4 / 5');
    });
  });

  it('should render custom ModalGallery component from context', async () => {
    const galleryContent = nanoid();
    const CustomGallery = () => <div>{galleryContent}</div>;
    const { getAllByTestId, getByText } = render(
      <ComponentProvider value={{ ModalGallery: CustomGallery }}>
        <Gallery images={mockGalleryAssets} />
      </ComponentProvider>,
    );

    fireEvent.click(getAllByTestId('gallery-image')[0]);

    await waitFor(() => {
      expect(getByText(galleryContent)).toBeInTheDocument();
    });
  });
});
