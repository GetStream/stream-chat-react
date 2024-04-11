/* eslint-disable jest-dom/prefer-in-document */

import React, { useEffect } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { AttachmentPreviewList, ImagePreviewItem } from '../AttachmentPreviewList';
import { ChannelActionProvider, ComponentProvider, useChatContext } from '../../../context';
import { MessageInputContextProvider } from '../../../context/MessageInputContext';

import {
  generateAudioAttachment,
  generateUpload,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../mock-builders';

const RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const DELETE_BTN_TEST_ID = 'file-preview-item-delete-button';
const LOADING_INDICATOR_TEST_ID = 'loading-indicator';

const uploadsReducer = (pv, cv) => {
  pv[cv.id] = cv;
  return pv;
};

/**
 * @param {string} word
 * @returns string
 */
const capitalize = ([firstLetter, ...restOfTheWord]) =>
  `${firstLetter.toUpperCase()}${restOfTheWord.join('')}`;

const orderMapper = ({ id }) => id;

const generateMessageInputContextValue = ({ attachments = [], files = [], images = [] } = {}) => ({
  attachments,
  fileOrder: files.map(orderMapper),
  fileUploads: files.reduce(uploadsReducer, {}),
  imageOrder: images.map(orderMapper),
  imageUploads: images.reduce(uploadsReducer, {}),
  removeAttachment: jest.fn(),
  removeFile: jest.fn(),
  removeImage: jest.fn(),
  uploadAttachment: jest.fn(),
  uploadFile: jest.fn(),
  uploadImage: jest.fn(),
});

const renderComponent = (value = {}, renderFunction = render) =>
  renderFunction(
    <ComponentProvider value={{}}>
      <ChannelActionProvider value={{}}>
        <MessageInputContextProvider value={{ ...generateMessageInputContextValue(), ...value }}>
          <AttachmentPreviewList />
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
    renderComponent(
      generateMessageInputContextValue({
        attachments: [
          generateAudioAttachment({
            $internal: { uploadState: state },
            title: `audio-attachment-${state}`,
          }),
          generateVoiceRecordingAttachment({
            $internal: { uploadState: state },
            title: `voice-recording-attachment-${state}`,
          }),
          generateVideoAttachment({
            $internal: { uploadState: state },
            title: `video-attachment-${state}`,
          }),
        ],
        files: [
          generateUpload({
            fileOverrides: { name: `file-upload-${state}` },
            objectOverrides: { state },
          }),
        ],
        images: [
          generateUpload({
            fileOverrides: { name: `image-upload-${state}`, type: 'image' },
            objectOverrides: { state },
          }),
        ],
      }),
      render,
    );

    expect(screen.getByTitle(`file-upload-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`image-upload-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`audio-attachment-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`voice-recording-attachment-${state}`)).toBeInTheDocument();
    expect(screen.getByTitle(`video-attachment-${state}`)).toBeInTheDocument();
  });

  it.each(['file', 'image'])('retries upload on click with %s', (type) => {
    const file = generateUpload({
      fileOverrides: { type },
      objectOverrides: { state: 'failed' },
    });

    const contextValue = generateMessageInputContextValue({ [`${type}s`]: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const retryButton = getByTestId(`${type}-preview-item-retry-button`);

    fireEvent.click(retryButton);

    expect(contextValue[`upload${capitalize(type)}`]).toHaveBeenCalledWith(file.id);
  });

  it.each(['audio', 'voiceRecording', 'video'])('retries upload on click with %s', (type) => {
    const state = 'failed';
    const title = `${type}-attachment-${state}`;
    const generate = {
      audio: generateAudioAttachment,
      video: generateVideoAttachment,
      voiceRecording: generateVoiceRecordingAttachment,
    };
    const uploadedAttachmentData = generate[type]({
      title,
    });
    const localAttachment = { ...uploadedAttachmentData, $internal: { uploadState: state } };

    const contextValue = generateMessageInputContextValue({
      attachments: [localAttachment],
    });

    renderComponent(contextValue);

    const retryButton = screen.getByTestId(RETRY_BTN_TEST_ID);

    fireEvent.click(retryButton);

    expect(contextValue.uploadAttachment).toHaveBeenCalledWith(
      expect.objectContaining(uploadedAttachmentData),
    );
  });

  it.each(['file', 'image'])('renders loading indicator for %s preview', (type) => {
    const file = generateUpload({
      fileOverrides: { type },
      objectOverrides: { state: 'uploading' },
    });

    const contextValue = generateMessageInputContextValue({ [`${type}s`]: [file] });

    renderComponent(contextValue);

    expect(screen.queryByTestId(LOADING_INDICATOR_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
  });

  it.each(['audio', 'voiceRecording', 'video'])(
    'renders loading indicator for %s preview',
    (type) => {
      const state = 'uploading';
      const title = `${type}-attachment-${state}`;
      const generate = {
        audio: generateAudioAttachment,
        video: generateVideoAttachment,
        voiceRecording: generateVoiceRecordingAttachment,
      };
      const uploadedAttachmentData = generate[type]({
        title,
      });
      const localAttachment = { ...uploadedAttachmentData, $internal: { uploadState: state } };

      const contextValue = generateMessageInputContextValue({
        attachments: [localAttachment],
      });

      renderComponent(contextValue);

      expect(screen.queryByTestId(LOADING_INDICATOR_TEST_ID)).toBeInTheDocument();
      expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
    },
  );

  it.each(['file', 'image'])('tests "remove" click on %s upload', (type) => {
    const file = generateUpload({
      fileOverrides: { type },
      objectOverrides: { state: 'finished' },
    });

    const contextValue = generateMessageInputContextValue({ [`${type}s`]: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const deleteButton = getByTestId(`${type}-preview-item-delete-button`);

    fireEvent.click(deleteButton);

    expect(contextValue[`remove${capitalize(type)}`]).toHaveBeenCalledWith(file.id);
  });

  it.each(['audio', 'voiceRecording', 'video'])(
    'removes retry button on %s successful upload',
    (type) => {
      const state = 'finished';
      const title = `${type}-attachment-${state}`;
      const generate = {
        audio: generateAudioAttachment,
        video: generateVideoAttachment,
        voiceRecording: generateVoiceRecordingAttachment,
      };
      const uploadedAttachmentData = generate[type]({
        title,
      });
      const localAttachment = { ...uploadedAttachmentData, $internal: { uploadState: state } };

      const contextValue = generateMessageInputContextValue({
        attachments: [localAttachment],
      });

      renderComponent(contextValue);

      expect(screen.queryByTestId(RETRY_BTN_TEST_ID)).not.toBeInTheDocument();
    },
  );

  it.each(['audio', 'voiceRecording', 'video'])('removes the %s preview', (type) => {
    const state = 'finished';
    const title = `${type}-attachment-${state}`;
    const id = `${type}-id`;
    const generate = {
      audio: generateAudioAttachment,
      video: generateVideoAttachment,
      voiceRecording: generateVoiceRecordingAttachment,
    };
    const uploadedAttachmentData = generate[type]({
      title,
    });
    const localAttachment = { ...uploadedAttachmentData, $internal: { id, uploadState: state } };

    const contextValue = generateMessageInputContextValue({
      attachments: [localAttachment],
    });

    renderComponent(contextValue);

    fireEvent.click(screen.getByTestId(DELETE_BTN_TEST_ID));

    expect(contextValue.removeAttachment).toHaveBeenCalledWith(localAttachment.$internal.id);
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

    const names = ['image-upload-1', 'image-upload-2'];
    const images = names.map((name, id) =>
      generateUpload({
        fileOverrides: { name, type: 'image' },
        objectOverrides: { id },
      }),
    );
    const CustomBaseImage = (props) => <img {...props} data-testid={'custom-base-image'} />;
    let result;
    await act(() => {
      result = render(
        <Chat client={client}>
          <ActiveChannelSetter activeChannel={channel} />
          <Channel BaseImage={CustomBaseImage}>
            <MessageInputContextProvider value={generateMessageInputContextValue({ images })}>
              <AttachmentPreviewList />
            </MessageInputContextProvider>
          </Channel>
          ,
        </Chat>,
      );
    });
    expect(result.container).toMatchSnapshot();
  });
});

describe('ImagePreviewItem', () => {
  const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
  const getImage = () => screen.queryByTestId(BASE_IMAGE_TEST_ID);
  const defaultId = '7VZCBda5mQQk49icgNaUJ';
  const imageUploads = {
    [defaultId]: {
      file: {
        path:
          '29c4727a-82ad-4a14-8a49-6a6ba94396b2.300a558c-cb2a-495d-ac5e-b703a24d313f.c7dff19.heic',
      },
      id: defaultId,
      state: 'finished',
      url: 'https://us-east.stream-io-cdn.com/1145265/images/abc&oh=6120&ow=8160',
    },
  };
  const defaultInputContext = {
    imageUploads,
    removeImage: jest.fn(),
    uploadImage: jest.fn(),
  };
  const renderImagePreviewItem = ({ id, ...inputContext } = {}) =>
    render(
      <ComponentProvider value={{}}>
        <MessageInputContextProvider value={{ ...defaultInputContext, ...inputContext }}>
          <ImagePreviewItem id={id || defaultId} />
        </MessageInputContextProvider>
      </ComponentProvider>,
    );

  it('does not render images not found in the input attachment state', () => {
    const { container } = renderImagePreviewItem({ id: 'X' });
    expect(container).toBeEmptyDOMElement();
  });
  it('does not render scraped images', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], og_scrape_url: 'og_scrape_url' } },
    });
    expect(container).toBeEmptyDOMElement();
  });
  it('renders uploading state', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'uploading' } },
    });
    expect(container).toMatchSnapshot();
  });
  it('renders upload finished state', () => {
    const { container } = renderImagePreviewItem();
    expect(container).toMatchSnapshot();
  });
  it('renders upload failed state', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'failed' } },
    });
    expect(container).toMatchSnapshot();
  });
  it('reflects the image load error with str-chat__attachment-preview-image--error class', () => {
    const { container } = renderImagePreviewItem();
    fireEvent.error(getImage());
    expect(container.children[0].className).toMatch('str-chat__attachment-preview-image--error');
  });
  it('asks to retry uploading the image', () => {
    renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'failed' } },
    });
    fireEvent.click(screen.getByTestId('image-preview-item-retry-button'));
    expect(defaultInputContext.uploadImage).toHaveBeenCalledTimes(1);
  });
  it('asks to remove image from input attachment state', () => {
    renderImagePreviewItem();
    fireEvent.click(screen.getByTestId('image-preview-item-delete-button'));
    expect(defaultInputContext.removeImage).toHaveBeenCalledTimes(1);
  });
});
