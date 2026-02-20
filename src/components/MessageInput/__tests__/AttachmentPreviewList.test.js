import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttachmentPreviewList } from '../AttachmentPreviewList';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';

import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateLocalImageUploadAttachmentData,
  generateMessage,
  generateStaticLocationResponse,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../mock-builders';
import { MessageProvider, WithComponents } from '../../../context';

jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation();

const RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const RETRY_BTN_IMAGE_TEST_ID = 'image-preview-item-retry-button';
const DELETE_BTN_TEST_ID = 'file-preview-item-delete-button';
const DELETE_BTN_IMAGE_TEST_ID = 'image-preview-item-delete-button';
const LOADING_INDICATOR_TEST_ID = 'loading-indicator';

const renderComponent = async ({
  attachments,
  channel: customChannel,
  client: customClient,
  components,
  coords,
  editedMessage,
  props,
} = {}) => {
  let channel = customChannel;
  let client = customClient;
  if (!(customChannel && customClient)) {
    const initiated = await initClientWithChannels();
    client = initiated.client;
    channel = initiated.channels[0];
  }
  channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
  if (coords) channel.messageComposer.locationComposer.setData(coords);
  let result;
  await act(() => {
    result = render(
      <WithComponents overrides={components}>
        <Chat client={client}>
          <Channel channel={channel}>
            {editedMessage ? (
              <MessageProvider
                value={{
                  message: {
                    ...editedMessage,
                    cid: channel.cid,
                    id: channel.id,
                    type: channel.type,
                  },
                }}
              >
                <AttachmentPreviewList {...props} />
              </MessageProvider>
            ) : (
              <AttachmentPreviewList {...props} />
            )}
          </Channel>
        </Chat>
      </WithComponents>,
    );
  });
  return { channel, ...result };
};

jest.mock('nanoid', () => ({
  nanoid: () => 'randomNanoId',
}));

describe('AttachmentPreviewList', () => {
  it('does not render without attachments', async () => {
    await renderComponent();

    const attachmentList = screen.queryByTestId('attachment-list-scroll-container');

    expect(attachmentList).not.toBeInTheDocument();
  });

  it.each(['uploading', 'failed', 'finished'])(
    'renders previews with state "%s"',
    async (state) => {
      await renderComponent({
        attachments: [
          generateAudioAttachment({
            localMetadata: { id: 'audio-attachment-id', uploadState: state },
            title: `audio-attachment-${state}`,
          }),
          generateVoiceRecordingAttachment({
            localMetadata: { id: 'voice-recording-attachment-id', uploadState: state },
            title: `voice-recording-attachment-${state}`,
          }),
          generateVideoAttachment({
            localMetadata: { id: 'video-attachment-id', uploadState: state },
            title: `video-attachment-${state}`,
          }),
          generateFileAttachment({
            localMetadata: { id: 'file-attachment-id', uploadState: state },
            title: `file-upload-${state}`,
          }),
          generateImageAttachment({
            fallback: `image-upload-${state}`,
            localMetadata: { id: 'image-attachment-id', uploadState: state },
          }),
        ],
      });

      expect(screen.getByTitle(`file-upload-${state}`)).toBeInTheDocument();
      expect(screen.getByTitle(`image-upload-${state}`)).toBeInTheDocument();
      expect(screen.getByTitle(`audio-attachment-${state}`)).toBeInTheDocument();
      // Voice recordings are rendered in VoiceRecordingPreviewSlot above the list (REACT-794)
      expect(screen.getByTitle(`video-attachment-${state}`)).toBeInTheDocument();
    },
  );

  // voiceRecording is rendered in VoiceRecordingPreviewSlot (REACT-794), not in AttachmentPreviewList
  describe.each(['audio', 'file', 'image', 'unsupported', 'video'])(
    '%s attachments rendering',
    (type) => {
      const customAttachment = {
        id: new Date().toISOString(),
        latitude: 456,
        longitude: 123,
        mimeType: 'text/plain',
        title: 'custom-title.txt',
        type: 'geolocation',
      };

      const generate = {
        audio: generateAudioAttachment,
        file: generateFileAttachment,
        image: generateImageAttachment,
        unsupported: () => customAttachment,
        video: generateVideoAttachment,
      };

      it('retries upload on upload button click', async () => {
        const state = 'failed';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();
        const uploadAttachmentSpy = jest.spyOn(
          channel.messageComposer.attachmentManager,
          'uploadAttachment',
        );

        await renderComponent({
          attachments: [localAttachment],
          channel,
          client,
        });

        const retryButton = screen.getByTestId(
          type === 'image' ? RETRY_BTN_IMAGE_TEST_ID : RETRY_BTN_TEST_ID,
        );

        fireEvent.click(retryButton);

        expect(uploadAttachmentSpy).toHaveBeenCalledWith(
          expect.objectContaining(uploadedAttachmentData),
        );
      });

      it('renders loading indicator in preview', async () => {
        const state = 'uploading';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        await renderComponent({
          attachments: [localAttachment],
        });

        expect(screen.queryByTestId(LOADING_INDICATOR_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
      });

      it('removes retry button on successful upload', async () => {
        const state = 'finished';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        await renderComponent({
          attachments: [localAttachment],
        });

        expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
      });

      it('removes the preview', async () => {
        const state = 'finished';
        const title = `${type}-attachment-${state}`;
        const id = `${type}-id`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id, uploadState: state },
        };

        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();
        const removeAttachmentsSpy = jest.spyOn(
          channel.messageComposer.attachmentManager,
          'removeAttachments',
        );

        await renderComponent({
          attachments: [localAttachment],
          channel,
          client,
        });

        fireEvent.click(
          screen.getByTestId(
            type === 'image' ? DELETE_BTN_IMAGE_TEST_ID : DELETE_BTN_TEST_ID,
          ),
        );

        expect(removeAttachmentsSpy).toHaveBeenCalledWith([
          localAttachment.localMetadata.id,
        ]);
      });

      it('renders custom preview component', async () => {
        const previewComponentNames = {
          audio: 'AudioAttachmentPreview',
          file: 'FileAttachmentPreview',
          image: 'ImageAttachmentPreview',
          unsupported: 'UnsupportedAttachmentPreview',
          video: 'MediaAttachmentPreview',
        };
        const title = `${type}-attachment`;
        const id = `${type}-id`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id },
        };

        const text = `custom-${title}`;
        const CustomPreviewComponent = () => <div>{text}</div>;
        await renderComponent({
          attachments: [localAttachment],
          props: { [previewComponentNames[type]]: CustomPreviewComponent },
        });

        expect(screen.queryByText(text)).toBeInTheDocument();
      });
    },
  );

  it('should render custom BaseImage component', async () => {
    const BaseImage = (props) => <img {...props} data-testid={'custom-base-image'} />;
    const { container } = await renderComponent({
      attachments: ['image-upload-1', 'image-upload-2'].map((id) =>
        generateLocalImageUploadAttachmentData(
          { id, uploadState: 'uploading' },
          { fallback: id },
        ),
      ),
      components: { BaseImage },
    });
    expect(container).toMatchSnapshot();
  });

  describe('shared location', () => {
    it('should be rendered with location preview', async () => {
      await renderComponent({
        attachments: [],
        coords: { latitude: 2, longitude: 2 },
      });
      expect(screen.queryByTestId('location-preview')).toBeInTheDocument();
    });
    it('should be rendered with custom location preview', async () => {
      const GeolocationPreview = () => <div data-testid='geolocation-preview-custom' />;
      await renderComponent({
        attachments: [],
        coords: { latitude: 2, longitude: 2 },
        props: { GeolocationPreview },
      });
      expect(screen.queryByTestId('location-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('geolocation-preview-custom')).toBeInTheDocument();
    });

    it('should render location preview without possibility to remove it when editing a message', async () => {
      await renderComponent({
        attachments: [],
        coords: { latitude: 2, longitude: 2 },
        editedMessage: generateMessage({
          shared_location: generateStaticLocationResponse(),
        }),
      });
      expect(screen.queryByTestId('location-preview')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-preview-item-delete-button'),
      ).not.toBeInTheDocument();
    });
  });
});
