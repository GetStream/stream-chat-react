import React from 'react';
import { SearchController } from 'stream-chat';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { nanoid } from 'nanoid';

import { MessageInput } from '../MessageInput';
import { Channel } from '../../Channel/Channel';
import { MessageActions } from '../../MessageActions';

import { DialogManagerProvider, MessageProvider } from '../../../context';
import { ChatProvider } from '../../../context/ChatContext';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateLocalAttachmentData,
  generateMember,
  generateMessage,
  generateScrapedDataAttachment,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { generatePoll } from '../../../mock-builders/generator/poll';
import { QuotedMessagePreview } from '../QuotedMessagePreview';
import { WithComponents } from '../../../context';

expect.extend(toHaveNoViolations);

const IMAGE_PREVIEW_TEST_ID = 'attachment-preview-image';
const FILE_PREVIEW_TEST_ID = 'attachment-preview-file';
const FILE_INPUT_TEST_ID = 'file-input';
const FILE_UPLOAD_RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const SEND_BTN_TEST_ID = 'send-button';
const ATTACHMENT_PREVIEW_LIST_TEST_ID = 'attachment-list-scroll-container';
const UNKNOWN_ATTACHMENT_PREVIEW_TEST_ID = 'attachment-preview-unknown';

const cid = 'messaging:general';
const inputPlaceholder = 'Type your message';
const userId = 'userId';
const username = 'username';
const mentionId = 'mention-id';
const mentionName = 'mention-name';
const user = generateUser({ id: userId, name: username });
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
const mockAddNotification = jest.fn();

jest.mock('../../Channel/utils', () => ({
  ...jest.requireActual('../../Channel/utils'),
  makeAddNotifications: () => mockAddNotification,
}));

const defaultMessageContextValue = {
  getMessageActions: () => ['delete', 'edit', 'quote'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handleOpenThread: () => {},
  handlePin: () => {},
  isMyMessage: () => true,
  message: mainListMessage,
};

function dropFile(file, formElement) {
  fireEvent.drop(formElement, {
    dataTransfer: {
      files: [file],
      types: ['Files'],
    },
  });
}

const initQuotedMessagePreview = async (message) => {
  await waitFor(() => expect(screen.queryByText(message.text)).not.toBeInTheDocument());

  // Open the message actions dropdown
  const actionsButton = await screen.findByTestId('message-actions-toggle-button');
  await act(() => {
    fireEvent.click(actionsButton);
  });

  // Click the Quote button in the dropdown
  const quoteButton = await screen.findByText(/^quote$/i);
  await waitFor(() => expect(quoteButton).toBeInTheDocument());

  act(() => {
    fireEvent.click(quoteButton);
  });
};

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

const renderComponent = async ({
  channelData = [],
  channelProps = {},
  chatContextOverrides = {},
  components = {},
  customChannel,
  customClient,
  customUser,
  messageActionsProps = {},
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
      <WithComponents overrides={components}>
        <ChatProvider
          value={{ ...defaultChatContext, channel, client, ...chatContextOverrides }}
        >
          <DialogManagerProvider id='message-input-test-dialog-manager'>
            <Channel doSendMessageRequest={sendMessageMock} {...channelProps}>
              <MessageProvider
                value={{ ...defaultMessageContextValue, ...messageContextOverrides }}
              >
                <MessageActions
                  disableBaseMessageActionSetFilter
                  {...messageActionsProps}
                />
              </MessageProvider>
              <MessageInput {...messageInputProps} />
            </Channel>
          </DialogManagerProvider>
        </ChatProvider>
      </WithComponents>,
    );
  });

  const submit = async () => {
    const submitButton =
      renderResult.findByText('Send') || renderResult.findByTitle('Send');
    fireEvent.click(await submitButton);
  };

  return { channel, client, submit, ...renderResult };
};

const tearDown = () => {
  cleanup();
  jest.clearAllMocks();
};

function axeNoViolations(container) {
  return async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  };
}

const setup = async ({ channelData } = {}) => {
  const {
    channels: [customChannel],
    client: customClient,
  } = await initClientWithChannels({
    channelsData: [channelData ?? mockedChannelData],
    customUser: user,
  });
  const sendImageSpy = jest.spyOn(customChannel, 'sendImage').mockResolvedValueOnce({
    file: fileUploadUrl,
  });
  const sendFileSpy = jest.spyOn(customChannel, 'sendFile').mockResolvedValueOnce({
    file: fileUploadUrl,
  });
  customChannel.initialized = true;
  customClient.activeChannels[customChannel.cid] = customChannel;
  return { customChannel, customClient, sendFileSpy, sendImageSpy };
};

const setupUploadRejected = async (error) => {
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
  return { customChannel, customClient, sendFileSpy, sendImageSpy };
};

const renderWithActiveCooldown = async ({ messageInputProps = {} } = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [{ channel: { cooldown } }],
    customUser: user,
  });

  const lastSentSecondsAhead = 5;
  await renderComponent({
    chatContextOverrides: {
      latestMessageDatesByChannels: {
        [channel.cid]: new Date(new Date().getTime() + lastSentSecondsAhead * 1000),
      },
    },
    customChannel: channel,
    customClient: client,
    messageInputProps,
  });
};

describe(`MessageInputFlat`, () => {
  afterEach(tearDown);

  it('should render custom EmojiPicker', async () => {
    const CustomEmojiPicker = () => <div data-testid='custom-emoji-picker' />;

    await renderComponent({ components: { EmojiPicker: CustomEmojiPicker } });

    await waitFor(() => {
      const c = screen.getByTestId('custom-emoji-picker');
      expect(c).toBeInTheDocument();
    });
  });

  it('should contain placeholder text if no default message text provided', async () => {
    await renderComponent();
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('');
    });
  });

  it('should display default value', async () => {
    const defaultValue = nanoid();
    const { customChannel, customClient } = await setup();
    customChannel.messageComposer.textComposer.defaultValue = defaultValue;
    await renderComponent({
      customChannel,
      customClient,
    });
    await waitFor(() => {
      const textarea = screen.queryByDisplayValue(defaultValue);
      expect(textarea).toBeInTheDocument();
    });
  });

  it('should shift focus to the textarea if the `focus` prop is true', async () => {
    const { container } = await renderComponent({
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

  it('should render default file upload icon', async () => {
    const { container } = await renderComponent();
    const fileUploadIcon = await screen.findByTestId('invoke-attachment-selector-button');

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

    const { container } = await renderComponent({ components: { FileUploadIcon } });

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

    const { container } = await renderComponent({
      components: { AttachmentSelectorInitiationButtonContents, FileUploadIcon },
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

  it('are rendered in custom LinkPreviewList component', async () => {
    const LINK_PREVIEW_TEST_ID = 'link-preview-card';
    const scrapedData = generateScrapedDataAttachment({
      og_scrape_url: 'http://getstream.io',
      title: 'http://getstream.io',
    });
    const customTestId = 'custom-link-preview';
    const CustomLinkPreviewList = () => <div data-testid={customTestId} />;
    await renderComponent({
      components: { LinkPreviewList: CustomLinkPreviewList },
    });
    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
    });

    expect(await screen.queryByTestId(customTestId)).toBeInTheDocument();
    expect(await screen.queryByTestId(LINK_PREVIEW_TEST_ID)).not.toBeInTheDocument();
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
        expect(formElement).toHaveValue(pastedString);
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

    it('should not set multiple attribute on the file input if multipleUploads is false', async () => {
      const {
        channels: [customChannel],
        client: customClient,
      } = await initClientWithChannels({
        channelsData: [mockedChannelData],
        customUser: user,
      });
      customChannel.messageComposer.attachmentManager.maxNumberOfFilesPerMessage = 1;
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);
      expect(input).not.toHaveAttribute('multiple');
      await axeNoViolations(container);
    });

    it('should set multiple attribute on the file input if multipleUploads is true', async () => {
      const {
        channels: [customChannel],
        client: customClient,
      } = await initClientWithChannels({
        channelsData: [mockedChannelData],
        customUser: user,
      });
      customChannel.messageComposer.attachmentManager.maxNumberOfFilesPerMessage = 5;
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
      const { customChannel, customClient } = await setup();
      const { container } = await renderComponent({
        customChannel,
        customClient,
      });
      act(() => {
        customChannel.messageComposer.attachmentManager.maxNumberOfFilesPerMessage = 1;
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
      const { customChannel, customClient } = await setup();
      customChannel.messageComposer.attachmentManager.state.next({
        attachments: [{ ...generateLocalAttachmentData(), type: 'xxx' }],
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
      const { customChannel, customClient } = await setup();
      const scrapedAttachment = {
        ...generateLocalAttachmentData(),
        ...generateScrapedDataAttachment(),
      };
      const unknownAttachment = { ...generateLocalAttachmentData(), type: 'xxx' };
      customChannel.messageComposer.attachmentManager.state.next({
        attachments: [scrapedAttachment, unknownAttachment],
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
      const { customChannel, customClient } = await setup();
      customChannel.messageComposer.attachmentManager.state.next({
        attachments: [],
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(
        screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
      ).not.toBeInTheDocument();
    });

    it('should not show attachment previews if no files uploaded and attachments available are only link previews', async () => {
      const { customChannel, customClient } = await setup();
      customChannel.messageComposer.attachmentManager.state.next({
        attachments: [],
      });
      const linkPreviewData = generateScrapedDataAttachment();
      customChannel.messageComposer.linkPreviewsManager.state.next({
        previews: new Map([[linkPreviewData.og_scrape_url, linkPreviewData]]),
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
      const cause = new Error('failed to upload');
      const { customChannel, customClient, sendFileSpy } =
        await setupUploadRejected(cause);
      sendFileSpy.mockResolvedValueOnce({ file: fileUploadUrl });
      await renderComponent({
        customChannel,
        customClient,
      });

      jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getFile();

      await act(async () => await dropFile(file, formElement));

      await waitFor(() => {
        expect(screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(FILE_UPLOAD_RETRY_BTN_TEST_ID)).toBeInTheDocument();
      });

      await act(async () => await dropFile(file, formElement));

      await waitFor(() => {
        const previewList = screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);
        expect(previewList).toBeInTheDocument();
        expect(previewList.children).toHaveLength(2);
      });
    });
  });

  describe('Uploads disabled', () => {
    const channelData = { channel: { own_capabilities: [] } };

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
    it('should submit the input value when clicking the submit button', async () => {
      const { customChannel, customClient } = await setup();
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
      });

      const messageText = 'Some text';
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: messageText,
        },
      });

      await act(() => submit());

      expect(sendMessageMock).toHaveBeenCalledWith(
        customChannel,
        expect.objectContaining({
          text: messageText,
        }),
        {},
      );
      await axeNoViolations(container);
    });

    it('should allow to send custom message data', async () => {
      const { customChannel, customClient } = await setup();
      const customMessageData = { customX: 'customX' };
      const CustomStateSetter = null;

      customChannel.messageComposer.customDataManager.setMessageData(customMessageData);
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
        CustomStateSetter,
      });

      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: 'Some text',
        },
      });

      await act(() => submit());

      await waitFor(() => {
        expect(sendMessageMock).toHaveBeenCalledWith(
          customChannel,
          expect.objectContaining(customMessageData),
          {},
        );
      });
      await axeNoViolations(container);
    });

    it('should use overrideSubmitHandler prop if it is defined', async () => {
      const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
      const { customChannel, customClient } = await setup();
      const customMessageData = { customX: 'customX' };
      customChannel.messageComposer.customDataManager.setMessageData(customMessageData);
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
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

      expect(overrideMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cid: customChannel.cid,
          localMessage: expect.objectContaining({
            text: messageText,
            ...customMessageData,
          }),
          message: expect.objectContaining({
            text: messageText,
            ...customMessageData,
          }),
          sendOptions: expect.objectContaining({}),
        }),
      );
      await axeNoViolations(container);
    });

    it('should not do anything if the message is empty and has no files', async () => {
      const { customChannel, customClient } = await setup();
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
        messageContextOverrides: {
          message: {
            cid: customChannel.cid,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      });

      await act(() => submit());

      expect(sendMessageMock).not.toHaveBeenCalled();
      await axeNoViolations(container);
    });

    it('should add image as attachment if a message is submitted with an image', async () => {
      const { customChannel, customClient, sendImageSpy } = await setup();
      const { container, submit } = await renderComponent({
        customChannel,
        customClient,
      });
      // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);
      const file = getImage();
      await act(async () => {
        await dropFile(file, formElement);
      });

      // wait for image uploading to complete before trying to send the message

      await waitFor(() => expect(sendImageSpy).toHaveBeenCalled());

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
        expect(sendMessageMock).toHaveBeenCalledWith(
          customChannel,
          expect.objectContaining(msgFragment),
          {},
        );
      });

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

      expect(sendMessageMock).toHaveBeenCalledWith(
        customChannel,
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
      fireEvent.change(input, {
        target: {
          value: messageText,
        },
      });

      await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

      expect(sendMessageMock).not.toHaveBeenCalled();
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
      expect(sendMessageMock).toHaveBeenCalledWith(
        customChannel,
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

      expect(sendMessageMock).not.toHaveBeenCalled();

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

    expect(sendMessageMock).toHaveBeenCalledWith(
      customChannel,
      expect.objectContaining({
        mentioned_users: expect.arrayContaining([mentionId]),
        text: '@mention-name ',
      }),
      {},
    );

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
      components: {
        AutocompleteSuggestionList,
      },
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

  describe('QuotedMessagePreview', () => {
    it('is displayed on quote action click', async () => {
      await renderComponent();
      await initQuotedMessagePreview(mainListMessage);
      await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
    });

    it('renders proper markdown (through default renderText fn)', async () => {
      const m = generateMessage({
        mentioned_users: [{ id: 'john', name: 'John Cena' }],
        text: 'hey @John Cena',
        user,
      });
      await renderComponent({ messageContextOverrides: { message: m } });
      await initQuotedMessagePreview(m);

      expect(await screen.findByText('@John Cena')).toHaveAttribute('data-user-id');
    });

    it('uses custom renderText fn if provided', async () => {
      const m = generateMessage({
        text: nanoid(),
        user,
      });
      const fn = jest.fn().mockReturnValue(<div data-testid={m.text}>{m.text}</div>);
      await renderComponent({
        components: {
          QuotedMessagePreview: (props) => (
            <QuotedMessagePreview {...props} renderText={fn} />
          ),
        },
        messageContextOverrides: { message: m },
      });
      await initQuotedMessagePreview(m);

      expect(fn).toHaveBeenCalled();
      expect(await screen.findByTestId(m.text)).toBeInTheDocument();
    });

    it('is updated on original message update', async () => {
      const { channel, client } = await renderComponent();
      await initQuotedMessagePreview(mainListMessage);
      mainListMessage.text = new Date().toISOString();
      await act(() => {
        dispatchMessageUpdatedEvent(client, mainListMessage, channel);
      });
      await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
    });

    it('is closed on original message delete', async () => {
      const { channel, client } = await renderComponent();
      await initQuotedMessagePreview(mainListMessage);
      await act(() => {
        dispatchMessageDeletedEvent(client, mainListMessage, channel);
      });
      quotedMessagePreviewIsNotDisplayed(mainListMessage);
    });

    it('renders quoted Poll component if message contains poll', async () => {
      const poll = generatePoll();
      const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: 'X' });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ messages: [messageWithPoll] }],
      });
      const { container } = await renderComponent({
        customChannel: channel,
        customClient: client,
        messageContextOverrides: {
          ...defaultMessageContextValue,
          message: messageWithPoll,
        },
      });

      await initQuotedMessagePreview(messageWithPoll);
      expect(
        container.querySelector('.str-chat__quoted-poll-preview'),
      ).toBeInTheDocument();
    });

    it('renders custom quoted Poll component if message contains poll', async () => {
      const poll = generatePoll();
      const messageWithPoll = generateMessage({ poll, poll_id: poll.id, text: 'X' });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ messages: [messageWithPoll] }],
      });
      const pollText = 'Custom Poll component';
      const QuotedPoll = () => <div>{pollText}</div>;

      await renderComponent({
        components: { QuotedPoll },
        customChannel: channel,
        customClient: client,
        messageContextOverrides: {
          ...defaultMessageContextValue,
          message: messageWithPoll,
        },
      });

      await initQuotedMessagePreview(messageWithPoll);
      expect(screen.queryByText(pollText)).toBeInTheDocument();
    });
  });

  describe('send button', () => {
    it('should be renderer for empty input', async () => {
      await renderComponent();
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeInTheDocument();
    });

    it('should not be rendered during active cooldown period', async () => {
      await renderWithActiveCooldown();
      expect(screen.queryByTestId(SEND_BTN_TEST_ID)).not.toBeInTheDocument();
    });

    it('should not be renderer if explicitly hidden', async () => {
      await renderComponent({ messageInputProps: { hideSendButton: true } });
      expect(screen.queryByTestId(SEND_BTN_TEST_ID)).not.toBeInTheDocument();
    });

    it('should be disabled if there is no content to be submitted', async () => {
      await renderComponent();
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeDisabled();
    });

    it('should be enabled if there is text to be submitted', async () => {
      await renderComponent();
      await act(() => {
        fireEvent.change(screen.getByPlaceholderText(inputPlaceholder), {
          target: {
            value: 'X',
          },
        });
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeEnabled();
    });

    it('should be enabled if there are uploads to be submitted', async () => {
      const { customChannel, customClient } = await setup();
      await renderComponent({
        customChannel,
        customClient,
      });
      const file = getFile();

      await act(async () => {
        await fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
          target: {
            files: [file],
          },
        });
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeEnabled();
    });

    it('should disabled if there are failed attachments only', async () => {
      const error = new Error('Upload failed');
      const { customChannel, customClient } = await setupUploadRejected(error);
      await renderComponent({
        customChannel,
        customClient,
      });
      const file = getFile();

      await act(async () => {
        await fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
          target: {
            files: [file],
          },
        });
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).not.toBeEnabled();
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

  describe('SendToChannelCheckbox', () => {
    it('does not render in the channel context', async () => {
      const { customChannel, customClient } = await setup();
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(screen.queryByTestId('send-to-channel-checkbox')).not.toBeInTheDocument();
    });
  });
});
