/* eslint-disable jest-dom/prefer-in-document */

import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttachmentPreviewList } from '../AttachmentPreviewList';
import { ChannelActionProvider, ComponentProvider } from '../../../context';
import { MessageInputContextProvider } from '../../../context/MessageInputContext';

import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateLocalImageUploadAttachmentData,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
} from '../../../mock-builders';

jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation();

const RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const RETRY_BTN_IMAGE_TEST_ID = 'image-preview-item-retry-button';
const DELETE_BTN_TEST_ID = 'file-preview-item-delete-button';
const DELETE_BTN_IMAGE_TEST_ID = 'image-preview-item-delete-button';
const LOADING_INDICATOR_TEST_ID = 'loading-indicator';

const generateMessageInputContextValue = ({ attachments = [] } = {}) => ({
  attachments,
  removeAttachments: jest.fn(),
  uploadAttachment: jest.fn(),
});

const renderComponent = ({ componentCtx, contextValue, props, renderFunction } = {}) =>
  (renderFunction ?? render)(
    <ComponentProvider value={componentCtx ?? {}}>
      <ChannelActionProvider value={{}}>
        <MessageInputContextProvider
          value={{ ...generateMessageInputContextValue(), ...contextValue }}
        >
          <AttachmentPreviewList {...props} />
        </MessageInputContextProvider>
      </ChannelActionProvider>
    </ComponentProvider>,
  );

jest.mock('nanoid', () => ({
  nanoid: () => 'randomNanoId',
}));

describe('AttachmentPreviewList', () => {
  it('renders without any attachments', () => {
    const { getByTestId } = renderComponent();

    const attachmentList = getByTestId('attachment-list-scroll-container');

    expect(attachmentList).toBeEmptyDOMElement();
  });
  it.each(['uploading', 'failed', 'finished'])('renders previews with state "%s"', (state) => {
    renderComponent({
      contextValue: generateMessageInputContextValue({
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
      }),
    });

    expect(screen.getByTitle(`file-upload-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`image-upload-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`audio-attachment-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`voice-recording-attachment-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`video-attachment-${state}`)).toBeInTheDocument();
  });

  describe.each(['audio', 'file', 'image', 'unsupported', 'voiceRecording', 'video'])(
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
        voiceRecording: generateVoiceRecordingAttachment,
      };

      it('retries upload on upload button click', () => {
        const state = 'failed';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        const contextValue = generateMessageInputContextValue({
          attachments: [localAttachment],
        });

        renderComponent({ contextValue });

        const retryButton = screen.getByTestId(
          type === 'image' ? RETRY_BTN_IMAGE_TEST_ID : RETRY_BTN_TEST_ID,
        );

        fireEvent.click(retryButton);

        expect(contextValue.uploadAttachment).toHaveBeenCalledWith(
          expect.objectContaining(uploadedAttachmentData),
        );
      });

      it('renders loading indicator in preview', () => {
        const state = 'uploading';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        const contextValue = generateMessageInputContextValue({
          attachments: [localAttachment],
        });

        renderComponent({ contextValue });

        expect(screen.queryByTestId(LOADING_INDICATOR_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
      });

      it('removes retry button on successful upload', () => {
        const state = 'finished';
        const title = `${type}-attachment-${state}`;
        const uploadedAttachmentData = generate[type]({
          title,
        });
        const localAttachment = {
          ...uploadedAttachmentData,
          localMetadata: { id: new Date().toISOString(), uploadState: state },
        };

        const contextValue = generateMessageInputContextValue({
          attachments: [localAttachment],
        });

        renderComponent({ contextValue });

        expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
      });

      it('removes the preview', () => {
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

        const contextValue = generateMessageInputContextValue({
          attachments: [localAttachment],
        });

        renderComponent({ contextValue });

        fireEvent.click(
          screen.getByTestId(type === 'image' ? DELETE_BTN_IMAGE_TEST_ID : DELETE_BTN_TEST_ID),
        );

        expect(contextValue.removeAttachments).toHaveBeenCalledWith([
          localAttachment.localMetadata.id,
        ]);
      });

      it('renders custom preview component', () => {
        const previewComponentNames = {
          audio: 'AudioAttachmentPreview',
          file: 'FileAttachmentPreview',
          image: 'ImageAttachmentPreview',
          unsupported: 'UnsupportedAttachmentPreview',
          video: 'VideoAttachmentPreview',
          voiceRecording: 'VoiceRecordingPreview',
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

        const contextValue = generateMessageInputContextValue({
          attachments: [localAttachment],
        });
        const text = `custom-${title}`;
        const CustomPreviewComponent = () => <div>{text}</div>;
        renderComponent({
          contextValue,
          props: { [previewComponentNames[type]]: CustomPreviewComponent },
        });

        expect(screen.queryByText(text)).toBeInTheDocument();
      });
    },
  );

  it('should render custom BaseImage component', () => {
    const BaseImage = (props) => <img {...props} data-testid={'custom-base-image'} />;
    const { container } = renderComponent({
      componentCtx: { BaseImage },
      contextValue: generateMessageInputContextValue({
        attachments: ['image-upload-1', 'image-upload-2'].map((id) =>
          generateLocalImageUploadAttachmentData(
            { id, uploadState: 'uploading' },
            { fallback: id },
          ),
        ),
      }),
    });
    expect(container).toMatchSnapshot();
  });
});
