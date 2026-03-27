import React, { useEffect } from 'react';

import { act, cleanup, render, type RenderResult } from '@testing-library/react';

import { ImageComponent } from '../../Attachment/Image';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

import { useChatContext, WithComponents } from '../../../context';
import { ComponentProvider } from '../../../context/ComponentContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import {
  initClientWithChannels,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const mockImageUrl = 'https://placeimg.com/640/480/any';

// A simple no-op modal so tests don't need the full Dialog infrastructure
const NoOpModal = ({ children }) => <div>{children}</div>;

const renderWithProviders = (ui) =>
  render(
    <TranslationProvider value={mockTranslationContextValue()}>
      <ComponentProvider value={mockComponentContext({ Modal: NoOpModal })}>
        {ui}
      </ComponentProvider>
    </TranslationProvider>,
  );

describe('Image', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { container } = renderWithProviders(<ImageComponent imageUrl={mockImageUrl} />);
    expect(container).toMatchSnapshot();
  });

  it('should render an image with the provided imageUrl', () => {
    const { getAllByTestId } = renderWithProviders(
      <ImageComponent imageUrl={mockImageUrl} />,
    );
    const images = getAllByTestId('str-chat__base-image');
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(images[0]).toHaveAttribute('src', mockImageUrl);
  });

  it('should render a thumbnail button for the image', () => {
    const { container } = renderWithProviders(<ImageComponent imageUrl={mockImageUrl} />);
    const button = container.querySelector('button.str-chat__modal-gallery__image');
    expect(button).toBeInTheDocument();
  });

  it('should render custom BaseImage component', async () => {
    const ActiveChannelSetter = ({ activeChannel }) => {
      const { setActiveChannel } = useChatContext();
      useEffect(() => {
        setActiveChannel(activeChannel);
      }, [activeChannel]); // eslint-disable-line
      return null;
    };

    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    const CustomBaseImage = (props) => (
      <img {...props} data-testid={'custom-base-image'} />
    );
    let result: RenderResult;
    await act(() => {
      result = render(
        <WithComponents overrides={{ BaseImage: CustomBaseImage }}>
          <Chat client={client}>
            <ActiveChannelSetter activeChannel={channel} />
            <Channel>
              <ImageComponent alt='fallback' imageUrl='image_url' />
            </Channel>
          </Chat>
        </WithComponents>,
      );
    });
    const customImg = result.getByTestId('custom-base-image');
    expect(customImg).toBeInTheDocument();
    expect(customImg).toHaveAttribute('src', 'image_url');
    expect(customImg).toHaveAttribute('alt', 'fallback');
  });
});
