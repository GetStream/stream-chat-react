import React, { act } from 'react';
import { fireEvent, render, type RenderResult, screen } from '@testing-library/react';
import {
  AttachmentPreviewList,
  VoiceRecordingPreviewSlot,
} from '../AttachmentPreviewList';
import { GeolocationPreview } from '../AttachmentPreviewList/GeolocationPreview';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';

import { fromPartial } from '@total-typescript/shoehorn';
import type { Attachment } from 'stream-chat';

import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateLocalImageUploadAttachmentData,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../mock-builders';
import { WithComponents } from '../../../context';

vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

const LOADING_INDICATOR_TEST_ID = 'loading-indicator';
const ATTACHMENT_PREVIEW_LIST_TEST_ID = 'attachment-preview-list';
const ATTACHMENT_PREVIEW_TEST_IDS = {
  audio: {
    delete: 'file-preview-item-delete-button',
    retry: 'file-preview-item-retry-button',
  },
  file: {
    delete: 'file-preview-item-delete-button',
    retry: 'file-preview-item-retry-button',
  },
  image: {
    delete: 'video-preview-item-delete-button',
    retry: 'video-preview-item-retry-button',
  },
  unsupported: {
    delete: 'file-preview-item-delete-button',
    retry: 'file-preview-item-retry-button',
  },
  video: {
    delete: 'video-preview-item-delete-button',
    retry: 'video-preview-item-retry-button',
  },
};
const PREVIEW_COMPONENT_PROP_NAMES = {
  audio: 'AudioAttachmentPreview',
  file: 'FileAttachmentPreview',
  image: 'ImageAttachmentPreview',
  unsupported: 'UnsupportedAttachmentPreview',
  video: 'VideoAttachmentPreview',
};

const renderComponent = async ({
  attachments,
  channel: customChannel,
  client: customClient,
  component: Component = AttachmentPreviewList,
  components,
  coords,
  editedMessage,
  props,
}: any = {}) => {
  let channel = customChannel;
  let client = customClient;
  if (!(customChannel && customClient)) {
    const initiated = await initClientWithChannels();
    client = initiated.client;
    channel = initiated.channels[0];
  }
  const composerMessage = editedMessage
    ? {
        ...editedMessage,
        cid: channel.cid,
        id: channel.id,
        type: channel.type,
      }
    : undefined;
  channel.messageComposer.initState({ composition: composerMessage });
  channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
  if (coords) channel.messageComposer.locationComposer.setData(coords);
  let result: RenderResult;
  await act(() => {
    result = render(
      <WithComponents overrides={components}>
        <Chat client={client}>
          <Channel channel={channel}>
            <Component {...props} />
          </Channel>
        </Chat>
      </WithComponents>,
    );
  });
  return { channel, ...result };
};

vi.mock('nanoid', () => ({
  nanoid: () => 'randomNanoId',
}));

describe('AttachmentPreviewList', () => {
  it('does not render without attachments', async () => {
    await renderComponent();

    const attachmentList = screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);

    expect(attachmentList).not.toBeInTheDocument();
  });

  it.each(['uploading', 'failed', 'finished'])(
    'renders previews with state "%s"',
    async (state) => {
      await renderComponent({
        attachments: [
          generateAudioAttachment(
            fromPartial<Partial<Attachment>>({
              localMetadata: { id: 'audio-attachment-id', uploadState: state },
              title: `audio-attachment-${state}`,
            }),
          ),
          generateVoiceRecordingAttachment(
            fromPartial<Partial<Attachment>>({
              localMetadata: { id: 'voice-recording-attachment-id', uploadState: state },
              title: `voice-recording-attachment-${state}`,
            }),
          ),
          generateVideoAttachment(
            fromPartial<Partial<Attachment>>({
              localMetadata: { id: 'video-attachment-id', uploadState: state },
              title: `video-attachment-${state}`,
            }),
          ),
          generateFileAttachment(
            fromPartial<Partial<Attachment>>({
              localMetadata: { id: 'file-attachment-id', uploadState: state },
              title: `file-upload-${state}`,
            }),
          ),
          generateImageAttachment(
            fromPartial<Partial<Attachment>>({
              fallback: `image-upload-${state}`,
              localMetadata: { id: 'image-attachment-id', uploadState: state },
            }),
          ),
        ],
      });

      expect(screen.getByTitle(`file-upload-${state}`)).toBeInTheDocument();
      expect(screen.getByTitle(`image-upload-${state}`)).toBeInTheDocument();
      expect(screen.getByTitle(`audio-attachment-${state}`)).toBeInTheDocument();
      // Voice recordings are rendered in VoiceRecordingPreviewSlot above the list (REACT-794)
      expect(screen.getByTitle(`video-attachment-${state}`)).toBeInTheDocument();
    },
  );

  it('renders voice recordings in the dedicated full-width slot', async () => {
    const CustomVoiceRecordingPreview = () => (
      <div data-testid='custom-voice-recording-preview'>voice preview</div>
    );

    await renderComponent({
      attachments: [
        generateVoiceRecordingAttachment(
          fromPartial<Partial<Attachment>>({
            localMetadata: {
              id: 'voice-recording-attachment-id',
              uploadState: 'finished',
            },
            title: 'voice-recording-finished',
          }),
        ),
      ],
      component: VoiceRecordingPreviewSlot,
      props: {
        VoiceRecordingPreview: CustomVoiceRecordingPreview,
      },
    });

    const voicePreviewSlot = screen.getByTestId('voice-preview-slot');

    expect(voicePreviewSlot).toBeInTheDocument();
    expect(screen.getByTestId('custom-voice-recording-preview')).toBeInTheDocument();
  });

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
        const uploadAttachmentSpy = vi.spyOn(
          channel.messageComposer.attachmentManager,
          'uploadAttachment',
        );

        await renderComponent({
          attachments: [localAttachment],
          channel,
          client,
        });

        const retryButton = screen.getByTestId(ATTACHMENT_PREVIEW_TEST_IDS[type].retry);

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
        expect(
          screen.queryByTestId(ATTACHMENT_PREVIEW_TEST_IDS[type].retry),
        ).not.toBeInTheDocument();
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

        expect(
          screen.queryByTestId(ATTACHMENT_PREVIEW_TEST_IDS[type].retry),
        ).not.toBeInTheDocument();
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
        const removeAttachmentsSpy = vi.spyOn(
          channel.messageComposer.attachmentManager,
          'removeAttachments',
        );

        await renderComponent({
          attachments: [localAttachment],
          channel,
          client,
        });

        fireEvent.click(screen.getByTestId(ATTACHMENT_PREVIEW_TEST_IDS[type].delete));

        expect(removeAttachmentsSpy).toHaveBeenCalledWith([
          localAttachment.localMetadata.id,
        ]);
      });

      it('renders custom preview component', async () => {
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
          props: { [PREVIEW_COMPONENT_PROP_NAMES[type]]: CustomPreviewComponent },
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

  it('opens the gallery preview for image attachments', async () => {
    await renderComponent({
      attachments: [
        generateLocalImageUploadAttachmentData(
          { id: 'image-upload-1', uploadState: 'finished' },
          {
            fallback: 'image-upload-1',
            image_url: 'https://example.com/image-upload-1.jpg',
          },
        ),
      ],
    });

    fireEvent.click(screen.getByTestId('attachment-preview-media'));

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'image-upload-1' })).toBeInTheDocument();
  });

  describe('shared location', () => {
    const renderLocationPreview = async ({
      customPreview,
      location,
      remove,
    }: any = {}) => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();
      const PreviewComponent = customPreview || GeolocationPreview;
      let result: RenderResult;
      await act(() => {
        result = render(
          <Chat client={client}>
            <Channel channel={channel}>
              <PreviewComponent
                location={location || { latitude: 2, longitude: 2 }}
                remove={remove}
              />
            </Channel>
          </Chat>,
        );
      });
      return { channel, ...result };
    };

    it('should be rendered with location preview', async () => {
      await renderLocationPreview({ remove: vi.fn() });
      expect(screen.queryByTestId('location-preview')).toBeInTheDocument();
    });
    it('should be rendered with custom location preview', async () => {
      const CustomGeolocationPreview = () => (
        <div data-testid='geolocation-preview-custom' />
      );
      await renderLocationPreview({ customPreview: CustomGeolocationPreview });
      expect(screen.queryByTestId('location-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('geolocation-preview-custom')).toBeInTheDocument();
    });

    it('should render location preview without possibility to remove it when editing a message', async () => {
      // When editing, no remove callback is provided, so the remove button is absent
      await renderLocationPreview();
      expect(screen.queryByTestId('location-preview')).toBeInTheDocument();
      expect(
        screen.queryByTestId('location-preview-item-delete-button'),
      ).not.toBeInTheDocument();
    });
  });
});
