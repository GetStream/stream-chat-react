import React, { useEffect } from 'react';

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import { ImageComponent } from '../../Attachment/Image';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

import { useChatContext, WithComponents } from '../../../context';
import { ComponentProvider } from '../../../context/ComponentContext';

import { initClientWithChannels } from '../../../mock-builders';

const mockImageAssets = 'https://placeimg.com/640/480/any';

describe('Image', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { container } = render(
      <ComponentProvider value={{}}>
        <ImageComponent images={mockImageAssets} />
      </ComponentProvider>,
    );
    expect(container).toMatchSnapshot();
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
    let result;
    await act(() => {
      result = render(
        <WithComponents overrides={{ BaseImage: CustomBaseImage }}>
          <Chat client={client}>
            <ActiveChannelSetter activeChannel={channel} />
            <Channel>
              <ImageComponent
                fallback='fallback'
                image_url='image_url'
                thumb_url='thumb_url'
              />
            </Channel>
          </Chat>
        </WithComponents>,
      );
    });
    expect(result.container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat messaging light str-chat__channel"
          id="str-chat__channel"
        >
          <div
            class="str-chat__container"
          >
            <img
              alt="fallback"
              class="str-chat__message-attachment--img"
              data-testid="custom-base-image"
              src="image_url"
              tabindex="0"
              title="fallback"
            />
          </div>
        </div>
      </div>
    `);
  });
});
