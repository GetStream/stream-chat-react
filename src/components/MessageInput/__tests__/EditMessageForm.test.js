import React, { useEffect } from 'react';
import { MessageComposer, SearchController } from 'stream-chat';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { nanoid } from 'nanoid';

import { MessageInput } from '../MessageInput';
import { EditMessageForm } from '../EditMessageForm';
import { Channel } from '../../Channel/Channel';

import { MessageProvider } from '../../../context/MessageContext';
import { ChatProvider } from '../../../context/ChatContext';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateLocalAttachmentData,
  generateLocalFileUploadAttachmentData,
  generateMember,
  generateMessage,
  generateScrapedDataAttachment,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { generatePoll } from '../../../mock-builders/generator/poll';
import { QuotedMessagePreview } from '../QuotedMessagePreview';
import { useMessageComposer as useMessageComposerMock } from '../hooks';

jest.mock('../../Channel/utils', () => ({
  ...jest.requireActual('../../Channel/utils'),
  makeAddNotifications: () => mockAddNotification,
}));

jest.mock('../hooks/useMessageComposer', () => ({
  useMessageComposer: jest.fn().mockImplementation(),
}));

expect.extend(toHaveNoViolations);

const IMAGE_PREVIEW_TEST_ID = 'attachment-preview-image';
const FILE_PREVIEW_TEST_ID = 'attachment-preview-file';
const FILE_INPUT_TEST_ID = 'file-input';
const FILE_UPLOAD_RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const SEND_BTN_TEST_ID = 'send-button';
const SEND_BTN_EDIT_FORM_TEST_ID = 'send-button-edit-form';
const ATTACHMENT_PREVIEW_LIST_TEST_ID = 'attachment-list-scroll-container';
const UNKNOWN_ATTACHMENT_PREVIEW_TEST_ID = 'attachment-preview-unknown';

const cid = 'messaging:general';
const inputPlaceholder = 'Type your message';
const userId = 'userId';
const username = 'username';
const mentionId = 'mention-id';
const mentionName = 'mention-name';
const user = generateUser({ id: userId, image: 'user-image', name: username });
const mentionUser = generateUser({
  id: mentionId,
  name: mentionName,
});
const mainListMessage = generateMessage({ cid, user });
const threadMessage = generateMessage({
  parent_id: mainListMessage.id,
  type: 'reply',
  user,
});
const mockedChannelData = generateChannel({
  channel: {
    id: 'general',
    own_capabilities: ['send-poll', 'upload-file'],
    type: 'messaging',
  },
  members: [generateMember({ user }), generateMember({ user: mentionUser })],
  messages: [mainListMessage],
  thread: [threadMessage],
});

const defaultChatContext = {
  channelsQueryState: { queryInProgress: 'uninitialized' },
  getAppSettings: jest.fn(),
  latestMessageDatesByChannels: {},
  mutes: [],
  searchController: new SearchController(),
};

const cooldown = 30;
const filename = 'some.txt';
const fileUploadUrl = 'http://www.getstream.io'; // real url, because ImageAttachmentPreview will try to load the image

const getImage = () => new File(['content'], filename, { type: 'image/png' });
const getFile = (name = filename) => new File(['content'], name, { type: 'text/plain' });

const sendMessageMock = jest.fn();
const editMock = jest.fn();
const mockAddNotification = jest.fn();

const defaultMessageContextValue = {
  getMessageActions: () => ['delete', 'edit', 'quote'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  isMyMessage: () => true,
  message: mainListMessage,
  setEditingState: () => {},
};

function dropFile(file, formElement) {
  fireEvent.drop(formElement, {
    dataTransfer: {
      files: [file],
      types: ['Files'],
    },
  });
}

const renderComponent = async ({
  channelData = [],
  channelProps = {},
  chatContextOverrides = {},
  customChannel,
  customClient,
  CustomStateSetter = null,
  customUser,
  messageContextOverrides = {},
  messageInputProps = {},
} = {}) => {
  let channel = customChannel;
  let client = customClient;
  if (!(channel || client)) {
    const result = await initClientWithChannels({
      channelsData: [{ ...mockedChannelData, ...channelData }],
      customUser: customUser || user,
    });
    channel = result.channels[0];
    client = result.client;
  }
  let renderResult;

  await act(() => {
    renderResult = render(
      <ChatProvider
        value={{ ...defaultChatContext, channel, client, ...chatContextOverrides }}
      >
        <Channel
          doSendMessageRequest={sendMessageMock}
          doUpdateMessageRequest={editMock}
          {...channelProps}
        >
          <MessageProvider
            value={{
              ...defaultMessageContextValue,
              editing: true,
              ...messageContextOverrides,
            }}
          >
            {CustomStateSetter && <CustomStateSetter />}
            <MessageInput Input={EditMessageForm} {...messageInputProps} />
          </MessageProvider>
        </Channel>
      </ChatProvider>,
    );
  });

  const submit = async () => {
    const submitButton =
      renderResult.queryByTestId(SEND_BTN_EDIT_FORM_TEST_ID) ||
      renderResult.findByText('Send') ||
      renderResult.findByTitle('Send');
    fireEvent.click(await submitButton);
  };

  return { channel, client, submit, ...renderResult };
};

const tearDown = () => {
  cleanup();
  jest.clearAllMocks();
  useMessageComposerMock.mockReset();
};

function axeNoViolations(container) {
  return async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  };
}

const setup = async ({ channelData, composerConfig, composition } = {}) => {
  const {
    channels: [customChannel],
    client: customClient,
  } = await initClientWithChannels({
    channelsData: [channelData ?? mockedChannelData],
    customUser: user,
  });
  const sendImageSpy = jest.spyOn(customChannel, 'sendImage').mockResolvedValue({
    file: fileUploadUrl,
  });
  const sendFileSpy = jest.spyOn(customChannel, 'sendFile').mockResolvedValue({
    file: fileUploadUrl,
  });
  customChannel.initialized = true;
  customClient.activeChannels[customChannel.cid] = customChannel;
  const messageComposer = new MessageComposer({
    client: customClient,
    composition: composition ?? mainListMessage,
    compositionContext: composition ?? mainListMessage,
    config: composerConfig,
  });
  messageComposer.registerSubscriptions();
  // Set up the mock to return our messageComposer instance
  useMessageComposerMock.mockReturnValue(messageComposer);

  return { customChannel, customClient, messageComposer, sendFileSpy, sendImageSpy };
};

const setupUploadRejected = async ({ composerConfig, composition, error } = {}) => {
  const {
    channels: [customChannel],
    client: customClient,
  } = await initClientWithChannels({
    channelsData: [mockedChannelData],
    customUser: user,
  });
  const sendImageSpy = jest
    .spyOn(customChannel, 'sendImage')
    .mockRejectedValueOnce(error);
  const sendFileSpy = jest.spyOn(customChannel, 'sendFile').mockRejectedValueOnce(error);
  customClient.activeChannels[customChannel.cid] = customChannel;
  const messageComposer = new MessageComposer({
    client: customClient,
    composition: composition ?? mainListMessage,
    compositionContext: composition ?? mainListMessage,
    config: composerConfig,
  });

  // Set up the mock to return our messageComposer instance
  useMessageComposerMock.mockReturnValue(messageComposer);

  return { customChannel, customClient, messageComposer, sendFileSpy, sendImageSpy };
};

describe(`EditMessageForm`, () => {
  afterEach(tearDown);

  it('should render custom EmojiPicker', async () => {
    const CustomEmojiPicker = () => <div data-testid='custom-emoji-picker' />;
    const { customChannel, customClient } = await setup();
    await renderComponent({
      channelProps: { EmojiPicker: CustomEmojiPicker },
      customChannel,
      customClient,
    });

    await waitFor(() => {
      const c = screen.getByTestId('custom-emoji-picker');
      expect(c).toBeInTheDocument();
    });
  });

  it('should not contain placeholder text if message has text', async () => {
    const message = generateMessage({
      attachments: [generateLocalFileUploadAttachmentData()],
      cid,
      text: 'XXX',
    });
    const { customChannel, customClient } = await setup({ composition: message });

    await renderComponent({
      customChannel,
      customClient,
    });
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(message.text);
    });
  });

  it('should contain placeholder text if no default message text provided', async () => {
    const message = generateMessage({
      attachments: [generateLocalFileUploadAttachmentData()],
      cid,
      text: '',
    });
    const { customChannel, customClient } = await setup({ composition: message });
    await renderComponent({
      customChannel,
      customClient,
    });
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(message.text);
    });
  });

  it('should ignore default message text if provided', async () => {
    const defaultValue = nanoid();
    const { customChannel, customClient } = await setup();
    customChannel.messageComposer.textComposer.defaultValue = defaultValue;
    await renderComponent({
      customChannel,
      customClient,
    });
    await waitFor(() => {
      expect(screen.queryByDisplayValue(defaultValue)).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(mainListMessage.text)).toBeInTheDocument();
    });
  });

  it('should shift focus to the textarea if the `focus` prop is true', async () => {
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      customChannel,
      customClient,
      messageInputProps: {
        focus: true,
      },
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(inputPlaceholder)).toHaveFocus();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not shift focus to the textarea if the `focus` prop is false', async () => {
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      customChannel,
      customClient,
      messageInputProps: {
        focus: false,
      },
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(inputPlaceholder)).not.toHaveFocus();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render default file upload icon', async () => {
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      customChannel,
      customClient,
    });
    const fileUploadIcon = await screen.findByTitle('Attach files');

    await waitFor(() => {
      expect(fileUploadIcon).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom file upload svg provided as prop', async () => {
    const FileUploadIcon = () => (
      <svg>
        <title>NotFileUploadIcon</title>
      </svg>
    );
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      channelProps: { FileUploadIcon },
      customChannel,
      customClient,
    });

    const fileUploadIcon = await screen.findByTitle('NotFileUploadIcon');

    await waitFor(() => {
      expect(fileUploadIcon).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should prefer custom AttachmentSelectorInitiationButtonContents before custom FileUploadIcon', async () => {
    const FileUploadIcon = () => (
      <svg>
        <title>NotFileUploadIcon</title>
      </svg>
    );

    const AttachmentSelectorInitiationButtonContents = () => (
      <svg>
        <title>AttachmentSelectorInitiationButtonContents</title>
      </svg>
    );
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      channelProps: { AttachmentSelectorInitiationButtonContents, FileUploadIcon },
      customChannel,
      customClient,
    });

    const fileUploadIcon = await screen.queryByTitle('NotFileUploadIcon');
    const attachmentSelectorButtonIcon = await screen.getByTitle(
      'AttachmentSelectorInitiationButtonContents',
    );
    await waitFor(() => {
      expect(fileUploadIcon).not.toBeInTheDocument();
      expect(attachmentSelectorButtonIcon).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Attachments', () => {
    it('Pasting images and files should result in uploading the files and showing previews', async () => {
      const { customChannel, customClient, sendFileSpy, sendImageSpy } = await setup();
      const { container } = await renderComponent({ customChannel, customClient });
      const file = getFile();
      const image = getImage();

      const clipboardEvent = new Event('paste', {
        bubbles: true,
      });
      // set `clipboardData`. Mock DataTransfer object
      clipboardEvent.clipboardData = {
        items: [
          {
            getAsFile: () => file,
            kind: 'file',
          },
          {
            getAsFile: () => image,
            kind: 'file',
          },
        ],
      };
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      await act(async () => {
        await formElement.dispatchEvent(clipboardEvent);
      });
      const filenameTexts = await screen.findAllByTitle(filename);
      await waitFor(() => {
        expect(sendFileSpy).toHaveBeenCalledWith(file);
        expect(sendImageSpy).toHaveBeenCalledWith(image);
        expect(screen.getByTestId(IMAGE_PREVIEW_TEST_ID)).toBeInTheDocument();
        expect(screen.getByTestId(FILE_PREVIEW_TEST_ID)).toBeInTheDocument();
        filenameTexts.forEach((filenameText) => expect(filenameText).toBeInTheDocument());
        expect(screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID)).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('gives preference to pasting text over files', async () => {
      const { customChannel, customClient, sendFileSpy, sendImageSpy } = await setup();
      const { container } = await renderComponent({ customChannel, customClient });
      const pastedString = 'pasted string';

      const file = getFile();
      const image = getImage();

      const clipboardEvent = new Event('paste', {
        bubbles: true,
      });
      // set `clipboardData`. Mock DataTransfer object
      clipboardEvent.clipboardData = {
        items: [
          {
            getAsFile: () => file,
            kind: 'file',
          },
          {
            getAsFile: () => image,
            kind: 'file',
          },
          {
            getAsString: (cb) => cb(pastedString),
            kind: 'string',
            type: 'text/plain',
          },
        ],
      };
      const formElement = screen.getByPlaceholderText(inputPlaceholder);
      await act(async () => {
        await formElement.dispatchEvent(clipboardEvent);
      });

      await waitFor(() => {
        expect(sendFileSpy).not.toHaveBeenCalled();
        expect(sendImageSpy).not.toHaveBeenCalled();
        expect(screen.queryByTestId(IMAGE_PREVIEW_TEST_ID)).not.toBeInTheDocument();
        expect(screen.queryByTestId(FILE_PREVIEW_TEST_ID)).not.toBeInTheDocument();
        expect(screen.queryByText(filename)).not.toBeInTheDocument();
        expect(
          screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
        ).not.toBeInTheDocument();
        expect(formElement).toHaveValue(mainListMessage.text + pastedString);
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should upload an image when it is dropped on the dropzone', async () => {
      const { customChannel, customClient, sendImageSpy } = await setup();
      const { container } = await renderComponent({ customChannel, customClient });
      // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getImage();
      await act(() => {
        dropFile(file, formElement);
      });
      await waitFor(() => {
        expect(sendImageSpy).toHaveBeenCalledWith(file);
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should upload, display and link to a file when it is dropped on the dropzone', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({ customChannel, customClient });
      // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      await act(() => {
        dropFile(getFile(), formElement);
      });

      const filenameText = await screen.findByText(filename);

      expect(filenameText).toBeInTheDocument();
      const filePreview = screen.getByTestId(FILE_PREVIEW_TEST_ID);
      await waitFor(() => {
        expect(filePreview.querySelector('a')).toHaveAttribute('href', fileUploadUrl);
      });

      await axeNoViolations(container);
    });

    it('should allow uploading files with the file upload button', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({ customChannel, customClient });
      const file = getFile();
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);

      await act(() => {
        fireEvent.change(input, {
          target: {
            files: [file],
          },
        });
      });

      expect(screen.getByText(filename)).toBeInTheDocument();
      const filePreview = screen.getByTestId(FILE_PREVIEW_TEST_ID);
      await waitFor(() => {
        expect(filePreview.querySelector('a')).toHaveAttribute('href', fileUploadUrl);
      });
      await axeNoViolations(container);
    });

    // todo: JSDOM implementation used in Jest uses custom File mock that is different from that used in browser / node -> this
    it.skip('should call error handler if a file failed to upload and allow retrying', async () => {
      const error = new Error('failed to upload');
      const { customChannel, customClient, sendFileSpy } = await setupUploadRejected({
        error,
      });

      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getFile();

      act(() => dropFile(file, formElement));

      await waitFor(() => {
        expect(sendFileSpy).toHaveBeenCalledWith(file);
      });

      sendFileSpy.mockImplementationOnce(() => Promise.resolve({ file }));

      await act(() => {
        fireEvent.click(screen.getByTestId(FILE_UPLOAD_RETRY_BTN_TEST_ID));
      });

      await waitFor(() => {
        expect(sendFileSpy).toHaveBeenCalledTimes(2);
        expect(sendFileSpy).toHaveBeenCalledWith(file);
      });
      await axeNoViolations(container);
    });

    it('should not set multiple attribute on the file input if multipleUploads is false', async () => {
      const { customChannel, customClient } = await setup({
        composerConfig: { attachments: { maxNumberOfFilesPerMessage: 1 } },
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);
      expect(input).not.toHaveAttribute('multiple');
      await axeNoViolations(container);
    });

    it('should set multiple attribute on the file input if multipleUploads is true', async () => {
      const { customChannel, customClient } = await setup({
        composerConfig: { attachments: { maxNumberOfFilesPerMessage: 5 } },
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);
      expect(input).toHaveAttribute('multiple');
      await axeNoViolations(container);
    });

    const filename1 = '1.txt';
    const filename2 = '2.txt';
    it('should only allow dropping max number of files into the dropzone', async () => {
      const { customChannel, customClient } = await setup({
        composerConfig: { attachments: { maxNumberOfFilesPerMessage: 1 } },
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });

      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      const file = getFile(filename1);

      act(() => dropFile(file, formElement));

      await waitFor(() => expect(screen.queryByText(filename1)).toBeInTheDocument());

      const file2 = getFile(filename2);
      act(() => dropFile(file2, formElement));

      await waitFor(() => expect(screen.queryByText(filename2)).not.toBeInTheDocument());

      await axeNoViolations(container);
    });

    it('should show attachment previews if at least one non-scraped attachments available', async () => {
      const { customChannel, customClient } = await setup({
        composition: {
          ...mainListMessage,
          attachments: [{ ...generateLocalAttachmentData(), type: 'xxx' }],
        },
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      const previewListContainer = screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);
      expect(previewListContainer).toBeInTheDocument();
      expect(previewListContainer.children).toHaveLength(1);
      expect(previewListContainer.children[0]).toHaveAttribute(
        'data-testid',
        UNKNOWN_ATTACHMENT_PREVIEW_TEST_ID,
      );
    });

    it('should not show scraped content in attachment previews', async () => {
      const scrapedAttachment = {
        ...generateLocalAttachmentData(),
        ...generateScrapedDataAttachment(),
      };
      const unknownAttachment = { ...generateLocalAttachmentData(), type: 'xxx' };
      const { customChannel, customClient } = await setup({
        composition: {
          ...mainListMessage,
          attachments: [scrapedAttachment, unknownAttachment],
        },
      });

      await renderComponent({
        customChannel,
        customClient,
      });
      const previewListContainer = screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);
      expect(previewListContainer).toBeInTheDocument();
      expect(previewListContainer.children).toHaveLength(1);
      expect(previewListContainer.children[0]).toHaveAttribute(
        'data-testid',
        UNKNOWN_ATTACHMENT_PREVIEW_TEST_ID,
      );
    });

    it('should not show attachment previews if no files uploaded and no attachments available', async () => {
      const { customChannel, customClient } = await setup({
        composition: {
          ...mainListMessage,
          attachments: [],
        },
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(
        screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
      ).not.toBeInTheDocument();
    });

    it('should show attachment preview list if not only failed uploads are available', async () => {
      const error = new Error('failed to upload');
      const { customChannel, customClient, sendFileSpy } = await setupUploadRejected({
        error,
      });
      sendFileSpy.mockResolvedValueOnce({ file: fileUploadUrl });
      await renderComponent({
        customChannel,
        customClient,
      });

      jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getFile();

      await act(async () => {
        await dropFile(file, formElement);
      });

      await waitFor(() => {
        expect(screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(FILE_UPLOAD_RETRY_BTN_TEST_ID)).toBeInTheDocument();
      });

      await act(async () => {
        await dropFile(file, formElement);
      });

      await waitFor(() => {
        const previewList = screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);
        expect(previewList).toBeInTheDocument();
        expect(previewList.children).toHaveLength(2);
      });
    });
  });

  describe('Uploads disabled', () => {
    const channelData = { channel: { own_capabilities: [] } };

    it('should render file upload button disabled', async () => {
      const { customChannel, customClient } = await setup({
        channelData,
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      await waitFor(() => expect(screen.getByTestId(FILE_INPUT_TEST_ID)).toBeDisabled());
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('pasting images and files should do nothing', async () => {
      const { customChannel, customClient, sendFileSpy, sendImageSpy } = await setup({
        channelData,
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });

      const file = getFile();
      const image = getImage();

      const clipboardEvent = new Event('paste', { bubbles: true });
      // set `clipboardData`. Mock DataTransfer object
      clipboardEvent.clipboardData = {
        items: [
          { getAsFile: () => file, kind: 'file' },
          { getAsFile: () => image, kind: 'file' },
        ],
      };
      const formElement = screen.getByPlaceholderText(inputPlaceholder);

      await act(() => {
        formElement.dispatchEvent(clipboardEvent);
      });

      await waitFor(() => {
        expect(screen.queryByText(filename)).not.toBeInTheDocument();
        expect(sendFileSpy).not.toHaveBeenCalled();
        expect(sendImageSpy).not.toHaveBeenCalled();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should not upload an image when it is dropped on the dropzone', async () => {
      const { customChannel, customClient, sendImageSpy } = await setup({
        channelData,
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });

      // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getImage();

      await act(async () => {
        await dropFile(file, formElement);
      });

      await waitFor(() => {
        expect(sendImageSpy).not.toHaveBeenCalled();
      });
      await waitFor(axeNoViolations(container));
    });
  });

  describe('Submitting', () => {
    it('should submit the input value with text changed', async () => {
      const { customChannel, customClient } = await setup();
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
      });

      const messageText = 'Some text';
      await act(async () => {
        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });
      });

      await act(() => submit());

      expect(editMock).toHaveBeenCalledWith(
        customChannel.cid,
        expect.objectContaining({
          text: messageText,
        }),
        {},
      );
      await axeNoViolations(container);
    });

    // todo: button is not enabled at the moment when we want to click submit
    it.skip('should add image as attachment if a message is submitted with an image', async () => {
      const { customChannel, customClient, sendImageSpy } = await setup();
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
      });
      // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
      // const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getImage();
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);
      // await act(async () => {
      //   await dropFile(file, formElement);
      // });
      await act(async () => {
        await fireEvent.change(input, {
          target: {
            files: [file],
          },
        });
      });

      // wait for image uploading to complete before trying to send the message

      await waitFor(() => {
        expect(sendImageSpy).toHaveBeenCalled();
        // expect(screen.getByTestId(SEND_BTN_EDIT_FORM_TEST_ID)).toBeEnabled();
      });

      await waitFor(
        () => {
          expect(screen.getByTestId(SEND_BTN_EDIT_FORM_TEST_ID)).toBeEnabled();
        },
        { interval: 1, timeout: 2000 }, // Poll every 1ms up to 2 seconds
      );

      await act(async () => await submit());

      const msgFragment = {
        attachments: expect.arrayContaining([
          expect.objectContaining({
            image_url: fileUploadUrl,
            type: 'image',
          }),
        ]),
      };

      await waitFor(() => {
        expect(editMock).toHaveBeenCalledWith(
          customChannel.cid,
          expect.objectContaining(msgFragment),
          {},
        );
      });

      await axeNoViolations(container);
    });

    it('should allow to send custom message data', async () => {
      const { customChannel, customClient } = await setup();
      const customMessageData = { customX: 'customX' };
      const CustomStateSetter = () => {
        const composer = useMessageComposerMock();
        useEffect(() => {
          composer.customDataManager.setMessageData(customMessageData);
        }, [composer]);
      };
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
        CustomStateSetter,
      });

      await act(() => submit());

      await waitFor(() => {
        expect(editMock).toHaveBeenCalledWith(
          customChannel.cid,
          expect.objectContaining(customMessageData),
          {},
        );
      });
      await axeNoViolations(container);
    });

    it('should not call overrideSubmitHandler', async () => {
      const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
      const { customChannel, customClient } = await setup();
      const customMessageData = { customX: 'customX' };
      const CustomStateSetter = () => {
        const composer = useMessageComposerMock();
        useEffect(() => {
          composer.customDataManager.setMessageData(customMessageData);
        }, [composer]);
      };
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
        CustomStateSetter,
        messageInputProps: {
          overrideSubmitHandler: overrideMock,
        },
      });
      const messageText = 'Some text';

      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: messageText,
        },
      });

      await act(() => submit());
      expect(overrideMock).not.toHaveBeenCalled();

      await axeNoViolations(container);
    });

    it('should not do anything if the message is empty and has no files', async () => {
      const composition = {
        cid,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const { customChannel, customClient } = await setup({ composition });
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
        messageContextOverrides: {
          message: composition,
        },
      });

      await act(() => submit());

      expect(editMock).not.toHaveBeenCalled();
      await axeNoViolations(container);
    });

    it('should submit if shouldSubmit function is not provided but keydown events do match', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });

      const messageText = 'Some text';
      const input = await screen.findByPlaceholderText(inputPlaceholder);
      await act(async () => {
        await fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });
      });

      await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

      expect(editMock).toHaveBeenCalledWith(
        customChannel.cid,
        expect.objectContaining({
          text: messageText,
        }),
        {},
      );
      await axeNoViolations(container);
    });

    it('should not submit if shouldSubmit function is provided but keydown events do not match', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({
        customChannel,
        customClient,
        messageInputProps: {
          shouldSubmit: (e) => e.key === '9',
        },
      });
      const input = await screen.findByPlaceholderText(inputPlaceholder);

      const messageText = 'Some text';
      await act(async () => {
        await fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });
      });

      await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

      expect(editMock).not.toHaveBeenCalled();
      await axeNoViolations(container);
    });

    it('should submit if shouldSubmit function is provided and keydown events do match', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({
        customChannel,
        customClient,
        messageInputProps: {
          shouldSubmit: (e) => e.key === '9',
        },
      });
      const messageText = 'Submission text.';
      const input = await screen.findByPlaceholderText(inputPlaceholder);

      await act(async () => {
        await fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });
      });
      await act(async () => {
        await fireEvent.keyDown(input, {
          key: '9',
        });
      });
      expect(editMock).toHaveBeenCalledWith(
        customChannel.cid,
        expect.objectContaining({
          text: messageText,
        }),
        {},
      );

      await axeNoViolations(container);
    });

    it('should not submit if Shift key is pressed', async () => {
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      const messageText = 'Submission text.';
      const input = await screen.findByPlaceholderText(inputPlaceholder);

      await act(async () => {
        await fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });
      });
      await act(async () => {
        await fireEvent.keyDown(input, {
          key: 'Enter',
          shiftKey: true,
        });
      });
      expect(editMock).not.toHaveBeenCalled();

      await axeNoViolations(container);
    });
  });

  it('should list all the available users to mention if only @ is typed', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    // eslint-disable-next-line jest/prefer-spy-on
    Element.prototype.scrollIntoView = jest.fn();
    const { customChannel, customClient } = await setup();
    await renderComponent({
      customChannel,
      customClient,
      customUser: generateUser(),
    });

    const formElement = await screen.findByPlaceholderText(inputPlaceholder);
    await act(async () => {
      await fireEvent.change(formElement, {
        target: {
          selectionEnd: 1,
          selectionStart: 1,
          value: '@',
        },
      });
    });

    const usernameList = await screen.findAllByTestId('user-item-name');
    expect(usernameList).toHaveLength(
      Object.keys(customChannel.state.members).length - 1, // remove own user
    );
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  it('should add a mentioned user if @ is typed and a user is selected', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    // eslint-disable-next-line jest/prefer-spy-on
    Element.prototype.scrollIntoView = jest.fn();
    const { customChannel, customClient } = await setup();
    const { container, submit } = await renderComponent({
      customChannel,
      customClient,
      customUser: generateUser(),
    });

    const formElement = await screen.findByPlaceholderText(inputPlaceholder);
    await act(async () => {
      await fireEvent.change(formElement, {
        target: {
          selectionEnd: 1,
          selectionStart: 1,
          value: '@',
        },
      });
    });

    const usernameList = await screen.findAllByTestId('user-item-name');
    const firstItem = usernameList[0];
    await act(async () => {
      await fireEvent.click(firstItem);
    });

    await act(() => submit());

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mutes, ...userWithoutMutes } = mainListMessage.user;
    expect(editMock.mock.calls[1]).toEqual([
      customChannel.cid,
      expect.objectContaining({
        ...mainListMessage,
        deleted_at: null,
        error: null,
        mentioned_users: [
          expect.objectContaining({
            banned: false,
            created_at: '2020-04-27T13:39:49.331742Z',
            id: 'mention-id',
            image: expect.any(String),
            name: 'mention-name',
            online: false,
            role: 'user',
            updated_at: '2020-04-27T13:39:49.332087Z',
          }),
        ],
        parent_id: undefined,
        quoted_message: null,
        reaction_groups: null,
        text: '@mention-name ',
        user: userWithoutMutes,
        user_id: 'userId',
      }),
      {},
    ]);

    Element.prototype.scrollIntoView = scrollIntoView;
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should override the default List component when SuggestionList is provided as a prop', async () => {
    const AutocompleteSuggestionList = () => (
      <div data-testid='suggestion-list'>Suggestion List</div>
    );
    const { customChannel, customClient } = await setup();
    const { container } = await renderComponent({
      channelProps: { AutocompleteSuggestionList },
      customChannel,
      customClient,
    });

    const formElement = await screen.findByPlaceholderText(inputPlaceholder);

    // the component does not check whether there are items to be displayed
    expect(await screen.findByText('Suggestion List')).toBeInTheDocument();

    await act(() => {
      fireEvent.change(formElement, {
        target: { value: '/' },
      });
    });

    await waitFor(() =>
      expect(screen.queryByText('Suggestion List')).toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  const quotedMessagePreviewIsDisplayedCorrectly = async (message) => {
    await waitFor(() =>
      expect(screen.queryByTestId('quoted-message-preview')).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText(message.text)).toBeInTheDocument());
  };

  const quotedMessagePreviewIsNotDisplayed = (message) => {
    expect(screen.queryByText(/reply to message/i)).not.toBeInTheDocument();
    expect(screen.queryByText(message.text)).not.toBeInTheDocument();
  };

  const renderWithActiveCooldown = async ({ messageInputProps = {} } = {}) => {
    const { customChannel, customClient } = await setup({
      channelData: { channel: { cooldown } },
    });

    const lastSentSecondsAhead = 5;
    await renderComponent({
      chatContextOverrides: {
        latestMessageDatesByChannels: {
          [customChannel.cid]: new Date(
            new Date().getTime() + lastSentSecondsAhead * 1000,
          ),
        },
      },
      customChannel,
      customClient,
      messageInputProps,
    });
  };

  describe('QuotedMessagePreview', () => {
    const quotedMessage = generateMessage();
    const messageWithQuotedMessage = {
      ...mainListMessage,
      quoted_message: quotedMessage,
    };
    it('is displayed on quote action click', async () => {
      const { customChannel, customClient } = await setup({
        composition: messageWithQuotedMessage,
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
    });

    it('renders proper markdown (through default renderText fn)', async () => {
      const messageWithQuotedMessage = {
        ...mainListMessage,
        quoted_message: generateMessage({
          mentioned_users: [{ id: 'john', name: 'John Cena' }],
          text: 'hey @John Cena',
          user,
        }),
      };
      const { customChannel, customClient } = await setup({
        composition: messageWithQuotedMessage,
      });
      await renderComponent({
        customChannel,
        customClient,
      });

      expect(await screen.findByText('@John Cena')).toHaveAttribute('data-user-id');
    });

    it('uses custom renderText fn if provided', async () => {
      const messageWithQuotedMessage = {
        ...mainListMessage,
        quoted_message: generateMessage({
          text: nanoid(),
          user,
        }),
      };
      const quotedMsgText = messageWithQuotedMessage.quoted_message.text;
      const fn = jest
        .fn()
        .mockReturnValue(<div data-testid={quotedMsgText}>{quotedMsgText}</div>);

      const { customChannel, customClient } = await setup({
        composition: messageWithQuotedMessage,
      });
      await renderComponent({
        channelProps: {
          QuotedMessagePreview: (props) => (
            <QuotedMessagePreview {...props} renderText={fn} />
          ),
        },
        customChannel,
        customClient,
      });

      expect(fn).toHaveBeenCalled();
      expect(await screen.findByTestId(quotedMsgText)).toBeInTheDocument();
    });

    it('is updated on original message update', async () => {
      const { customChannel, customClient } = await setup({
        composition: messageWithQuotedMessage,
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      messageWithQuotedMessage.quoted_message.text = new Date().toISOString();
      await act(() => {
        dispatchMessageUpdatedEvent(
          customClient,
          messageWithQuotedMessage.quoted_message,
          customChannel,
        );
      });
      await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
    });

    it('is closed on original message delete', async () => {
      const { customChannel, customClient } = await setup({
        composition: messageWithQuotedMessage,
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      await act(() => {
        dispatchMessageDeletedEvent(
          customClient,
          messageWithQuotedMessage.quoted_message,
          customChannel,
        );
      });
      quotedMessagePreviewIsNotDisplayed(messageWithQuotedMessage.quoted_message);
    });

    it('renders quoted Poll component if message contains poll', async () => {
      const poll = generatePoll();
      const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: 'X' });
      const messageWithQuotedMessage = {
        ...mainListMessage,
        quoted_message: messageWithPoll,
      };
      const { customChannel, customClient } = await setup({
        channelData: { messages: [messageWithPoll, messageWithQuotedMessage] },
        composition: messageWithQuotedMessage,
      });
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });

      expect(
        container.querySelector('.str-chat__quoted-poll-preview'),
      ).toBeInTheDocument();
    });

    it('renders custom quoted Poll component if message contains poll', async () => {
      const poll = generatePoll();
      const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: 'X' });
      const messageWithQuotedMessage = {
        ...mainListMessage,
        quoted_message: messageWithPoll,
      };
      const { customChannel, customClient } = await setup({
        channelData: { messages: [messageWithPoll, messageWithQuotedMessage] },
        composition: messageWithQuotedMessage,
      });
      const pollText = 'Custom Poll component';
      const QuotedPoll = () => <div>{pollText}</div>;

      await renderComponent({
        channelProps: { QuotedPoll },
        customChannel,
        customClient,
      });

      expect(screen.queryByText(pollText)).toBeInTheDocument();
    });
  });

  describe('send button', () => {
    it('should be rendered when editing a message', async () => {
      const { customChannel, customClient } = await setup();
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeInTheDocument();
    });

    it('should not be renderer during active cooldown period', async () => {
      await renderWithActiveCooldown();
      expect(screen.queryByTestId(SEND_BTN_TEST_ID)).not.toBeInTheDocument();
    });

    it('should not be renderer if explicitly hidden', async () => {
      const { customChannel, customClient } = await setup();
      await renderComponent({
        customChannel,
        customClient,
        messageInputProps: { hideSendButton: true },
      });
      expect(screen.queryByTestId(SEND_BTN_TEST_ID)).not.toBeInTheDocument();
    });
  });

  describe('cooldown timer', () => {
    const COOLDOWN_TIMER_TEST_ID = 'cooldown-timer';

    it('should be renderer during active cool-down period', async () => {
      await renderWithActiveCooldown();
      expect(screen.getByTestId(COOLDOWN_TIMER_TEST_ID)).toBeInTheDocument();
    });

    it('should not be renderer if send button explicitly hidden', async () => {
      await renderWithActiveCooldown({ messageInputProps: { hideSendButton: true } });
      expect(screen.queryByTestId(COOLDOWN_TIMER_TEST_ID)).not.toBeInTheDocument();
    });

    it('should be removed after cool-down period elapsed', async () => {
      jest.useFakeTimers();
      await renderWithActiveCooldown();
      expect(screen.getByTestId(COOLDOWN_TIMER_TEST_ID)).toHaveTextContent(
        cooldown.toString(),
      );
      act(() => {
        jest.advanceTimersByTime(cooldown * 1000);
      });
      expect(screen.queryByTestId(COOLDOWN_TIMER_TEST_ID)).not.toBeInTheDocument();
      jest.useRealTimers();
    });
  });

  it('should not render the SendToChannelCheckbox content', async () => {
    const { customChannel, customClient } = await setup();
    await renderComponent({
      customChannel,
      customClient,
    });
    expect(screen.queryByTestId('send-to-channel-checkbox')).not.toBeInTheDocument();
  });
});
