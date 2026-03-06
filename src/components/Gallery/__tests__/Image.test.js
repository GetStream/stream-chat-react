import React from 'react';

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import { ImageComponent } from '../../Attachment/Image';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

import { WithComponents } from '../../../context';
import { ComponentProvider } from '../../../context/ComponentContext';
import { ModalDialogManagerProvider } from '../../../context/DialogManagerContext';

import { initClientWithChannels } from '../../../mock-builders';

const mockImageAssets = 'https://placeimg.com/640/480/any';

describe('Image', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { getByTestId } = render(
      <ModalDialogManagerProvider>
        <ComponentProvider value={{}}>
          <ImageComponent images={mockImageAssets} />
        </ComponentProvider>
      </ModalDialogManagerProvider>,
    );
    expect(getByTestId('str-chat__base-image')).toBeInTheDocument();
  });

  describe('it should prevent unsafe image uri protocols in the rendered image src', () => {
    it('should prevent javascript protocol in image src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ModalDialogManagerProvider>
          <ComponentProvider value={{}}>
            <ImageComponent image_url={xssJavascriptUri} />
          </ComponentProvider>
        </ModalDialogManagerProvider>,
      );
      expect(getByTestId('str-chat__base-image')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent javascript protocol in thumbnail src', () => {
      // eslint-disable-next-line no-script-url
      const xssJavascriptUri = 'javascript:alert("p0wn3d")';
      const { getByTestId } = render(
        <ModalDialogManagerProvider>
          <ComponentProvider value={{}}>
            <ImageComponent thumb_url={xssJavascriptUri} />
          </ComponentProvider>
        </ModalDialogManagerProvider>,
      );
      expect(getByTestId('str-chat__base-image')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent dataUris in image src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(
        <ModalDialogManagerProvider>
          <ComponentProvider value={{}}>
            <ImageComponent image_url={xssDataUri} />
          </ComponentProvider>
        </ModalDialogManagerProvider>,
      );
      expect(getByTestId('str-chat__base-image')).not.toHaveAttribute('src', xssDataUri);
    });
    it('should prevent dataUris in thumb src', () => {
      const xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';
      const { getByTestId } = render(
        <ModalDialogManagerProvider>
          <ComponentProvider value={{}}>
            <ImageComponent thumb_url={xssDataUri} />
          </ComponentProvider>
        </ModalDialogManagerProvider>,
      );
      expect(getByTestId('str-chat__base-image')).not.toHaveAttribute('src', xssDataUri);
    });
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);
    const { container, getByRole } = render(
      <ModalDialogManagerProvider>
        <ComponentProvider value={{}}>
          <ImageComponent images={mockImageAssets} />
        </ComponentProvider>
      </ModalDialogManagerProvider>,
    );
    fireEvent.click(getByRole('button', { name: 'Open image in gallery' }));

    await waitFor(() => {
      expect(
        container.querySelector('.str-chat__modal__overlay__close-button'),
      ).toBeInTheDocument();
    });
  });

  it('should render custom BaseImage component', async () => {
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
            <Channel channel={channel}>
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
    expect(result.getByTestId('str-chat__base-image')).toBeInTheDocument();
  });
});
