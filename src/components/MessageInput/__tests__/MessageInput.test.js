import React from 'react';
import { SearchController } from 'stream-chat';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { nanoid } from 'nanoid';

import { MessageInput } from '../MessageInput';
import { MessageInputFlat } from '../MessageInputFlat';
import { EditMessageForm } from '../EditMessageForm';
import { Channel } from '../../Channel/Channel';
import { MessageActionsBox } from '../../MessageActions';

import { MessageProvider } from '../../../context/MessageContext';
import { useMessageInputContext } from '../../../context/MessageInputContext';
import { ChatProvider } from '../../../context/ChatContext';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateFileAttachment,
  generateMember,
  generateMessage,
  generateScrapedDataAttachment,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { generatePoll } from '../../../mock-builders/generator/poll';
import { QuotedMessagePreview } from '../QuotedMessagePreview';
import { generateMessageDraft } from '../../../mock-builders/generator/messageDraft';
import { dispatchDraftUpdated } from '../../../mock-builders/event/draftUpdated';
import { dispatchDraftDeleted } from '../../../mock-builders/event/draftDeleted';

expect.extend(toHaveNoViolations);

const IMAGE_PREVIEW_TEST_ID = 'attachment-preview-image';
const FILE_PREVIEW_TEST_ID = 'attachment-preview-file';
const FILE_INPUT_TEST_ID = 'file-input';
const FILE_UPLOAD_RETRY_BTN_TEST_ID = 'file-preview-item-retry-button';
const SEND_BTN_TEST_ID = 'send-button';
const SEND_BTN_EDIT_FORM_TEST_ID = 'send-button-edit-form';
const ATTACHMENT_PREVIEW_LIST_TEST_ID = 'attachment-list-scroll-container';
const UNKNOWN_ATTACHMENT_PREVIEW_TEST_ID = 'attachment-preview-unknown';

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
const mainListMessage = generateMessage({ user });
const threadMessage = generateMessage({
  parent_id: mainListMessage.id,
  type: 'reply',
  user,
});
const mockedChannelData = generateChannel({
  channel: { own_capabilities: ['send-poll', 'upload-file'] },
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

const mockUploadApi = () =>
  jest.fn().mockImplementation(() =>
    Promise.resolve({
      file: fileUploadUrl,
    }),
  );

const mockFaultyUploadApi = (cause) =>
  jest.fn().mockImplementation(() => Promise.reject(cause));

const submitMock = jest.fn();
const editMock = jest.fn();
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

const makeRenderFn =
  (InputComponent) =>
  async ({
    channelData = [],
    channelProps = {},
    chatContextOverrides = {},
    customChannel,
    customClient,
    customUser,
    messageActionsBoxProps = {},
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

    const defaultMessageInputProps =
      InputComponent.name === 'EditMessageForm' ? { message: mainListMessage } : {};
    await act(() => {
      renderResult = render(
        <ChatProvider
          value={{ ...defaultChatContext, channel, client, ...chatContextOverrides }}
        >
          <Channel
            doSendMessageRequest={submitMock}
            doUpdateMessageRequest={editMock}
            {...channelProps}
          >
            <MessageProvider
              value={{ ...defaultMessageContextValue, ...messageContextOverrides }}
            >
              <MessageActionsBox
                {...messageActionsBoxProps}
                getMessageActions={defaultMessageContextValue.getMessageActions}
              />
            </MessageProvider>
            <MessageInput
              Input={InputComponent}
              {...{ ...defaultMessageInputProps, ...messageInputProps }}
            />
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
};

function axeNoViolations(container) {
  return async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  };
}

[
  { InputComponent: MessageInputFlat, name: 'MessageInputFlat' },
  { InputComponent: EditMessageForm, name: 'EditMessageForm' },
].forEach(({ InputComponent, name: componentName }) => {
  const renderComponent = makeRenderFn(InputComponent);

  describe(`${componentName}`, () => {
    afterEach(tearDown);

    it('should render custom EmojiPicker', async () => {
      const CustomEmojiPicker = () => <div data-testid='custom-emoji-picker' />;

      await renderComponent({ channelProps: { EmojiPicker: CustomEmojiPicker } });

      await waitFor(() => {
        const c = screen.getByTestId('custom-emoji-picker');
        expect(c).toBeInTheDocument();
      });
    });

    it('should contain placeholder text if no default message text provided', async () => {
      await renderComponent({ messageInputProps: { message: { text: '' } } });
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(inputPlaceholder);
        expect(textarea).toBeInTheDocument();
        expect(textarea.value).toBe('');
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
      const fileUploadIcon =
        componentName === 'EditMessageForm'
          ? await screen.findByTitle('Attach files')
          : await screen.getByTestId('invoke-attachment-selector-button');

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

      const { container } = await renderComponent({ channelProps: { FileUploadIcon } });

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
        channelProps: { AttachmentSelectorInitiationButtonContents, FileUploadIcon },
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
        const doImageUploadRequest = mockUploadApi();
        const doFileUploadRequest = mockUploadApi();
        const { container } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
            doImageUploadRequest,
          },
        });

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
        act(() => {
          formElement.dispatchEvent(clipboardEvent);
        });
        const filenameText = await screen.findByText(filename);
        await waitFor(() => {
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
          expect(doImageUploadRequest).toHaveBeenCalledWith(image, expect.any(Object));
          expect(screen.getByTestId(IMAGE_PREVIEW_TEST_ID)).toBeInTheDocument();
          expect(screen.getByTestId(FILE_PREVIEW_TEST_ID)).toBeInTheDocument();
          expect(filenameText).toBeInTheDocument();
          expect(screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID)).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('gives preference to pasting text over files', async () => {
        const doImageUploadRequest = mockUploadApi();
        const doFileUploadRequest = mockUploadApi();
        const pastedString = 'pasted string';
        const { container } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
            doImageUploadRequest,
          },
        });

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
          expect(doFileUploadRequest).not.toHaveBeenCalled();
          expect(doImageUploadRequest).not.toHaveBeenCalled();
          expect(screen.queryByTestId(IMAGE_PREVIEW_TEST_ID)).not.toBeInTheDocument();
          expect(screen.queryByTestId(FILE_PREVIEW_TEST_ID)).not.toBeInTheDocument();
          expect(screen.queryByText(filename)).not.toBeInTheDocument();
          expect(
            screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
          ).not.toBeInTheDocument();
          if (componentName === 'EditMessageForm') {
            expect(formElement.value.startsWith(pastedString)).toBeTruthy();
          } else {
            expect(formElement).toHaveValue(pastedString);
          }
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should upload an image when it is dropped on the dropzone', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { container } = await renderComponent({
          messageInputProps: {
            doImageUploadRequest,
          },
        });
        // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        await act(() => {
          dropFile(file, formElement);
        });
        await waitFor(() => {
          expect(doImageUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should upload, display and link to a file when it is dropped on the dropzone', async () => {
        const { container } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest: mockUploadApi(),
          },
        });
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
        const { container } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest: mockUploadApi(),
          },
        });
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

      it('should call error handler if an image failed to upload', async () => {
        const cause = new Error('failed to upload');
        const doImageUploadRequest = mockFaultyUploadApi(cause);
        const errorHandler = jest.fn();
        const { container } = await renderComponent({
          messageInputProps: {
            doImageUploadRequest,
            errorHandler,
          },
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();

        act(() => {
          dropFile(file, formElement);
        });

        await waitFor(() => {
          expect(errorHandler).toHaveBeenCalledWith(
            cause,
            'upload-attachment',
            expect.any(Object),
          );
          expect(doImageUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        await axeNoViolations(container);
      });

      it('should call error handler if a file failed to upload and allow retrying', async () => {
        const cause = new Error('failed to upload');
        const doFileUploadRequest = mockFaultyUploadApi(cause);
        const errorHandler = jest.fn();

        const { container } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
            errorHandler,
          },
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile();

        act(() => dropFile(file, formElement));

        await waitFor(() => {
          expect(errorHandler).toHaveBeenCalledWith(
            cause,
            'upload-attachment',
            expect.any(Object),
          );
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });

        doFileUploadRequest.mockImplementationOnce(() => Promise.resolve({ file }));

        await act(() => {
          fireEvent.click(screen.getByTestId(FILE_UPLOAD_RETRY_BTN_TEST_ID));
        });

        await waitFor(() => {
          expect(doFileUploadRequest).toHaveBeenCalledTimes(2);
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        await axeNoViolations(container);
      });

      it('should not set multiple attribute on the file input if multipleUploads is false', async () => {
        const { container } = await renderComponent({
          channelProps: {
            multipleUploads: false,
          },
        });
        const input = screen.getByTestId(FILE_INPUT_TEST_ID);
        expect(input).not.toHaveAttribute('multiple');
        await axeNoViolations(container);
      });

      it('should set multiple attribute on the file input if multipleUploads is true', async () => {
        const { container } = await renderComponent({
          channelProps: {
            multipleUploads: true,
          },
        });
        const input = screen.getByTestId(FILE_INPUT_TEST_ID);
        expect(input).toHaveAttribute('multiple');
        await axeNoViolations(container);
      });

      const filename1 = '1.txt';
      const filename2 = '2.txt';
      it('should only allow dropping maxNumberOfFiles files into the dropzone', async () => {
        const { container } = await renderComponent({
          channelProps: {
            maxNumberOfFiles: 1,
          },
          messageInputProps: {
            doFileUploadRequest: mockUploadApi(),
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);

        const file = getFile(filename1);

        act(() => dropFile(file, formElement));

        await waitFor(() => expect(screen.queryByText(filename1)).toBeInTheDocument());

        const file2 = getFile(filename2);
        act(() => dropFile(file2, formElement));

        await waitFor(() =>
          expect(screen.queryByText(filename2)).not.toBeInTheDocument(),
        );

        await axeNoViolations(container);
      });

      it('should only allow uploading 1 file if multipleUploads is false', async () => {
        const { container } = await renderComponent({
          channelProps: {
            multipleUploads: false,
          },
          messageInputProps: {
            doFileUploadRequest: mockUploadApi(),
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);

        const file = getFile(filename1);
        act(() => dropFile(file, formElement));

        await waitFor(() => expect(screen.queryByText(filename1)).toBeInTheDocument());

        const file2 = getFile(filename2);
        act(() => dropFile(file2, formElement));
        await waitFor(() =>
          expect(screen.queryByText(filename2)).not.toBeInTheDocument(),
        );
        await axeNoViolations(container);
      });

      it('should show notification if size limit is exceeded', async () => {
        defaultChatContext.getAppSettings.mockResolvedValueOnce({
          app: {
            file_upload_config: { size_limit: 1 },
            image_upload_config: { size_limit: 1 },
          },
        });
        await renderComponent({
          messageInputProps: {
            doFileUploadRequest: mockUploadApi(),
          },
        });
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile(filename1);
        await act(() => dropFile(file, formElement));
        await waitFor(() =>
          expect(screen.queryByText(filename1)).not.toBeInTheDocument(),
        );

        expect(mockAddNotification).toHaveBeenCalledTimes(1);
        expect(mockAddNotification.mock.calls[0][0]).toContain('File is too large');
      });

      it('should apply separate limits to files and images', async () => {
        defaultChatContext.getAppSettings.mockResolvedValueOnce({
          app: {
            file_upload_config: { size_limit: 100 },
            image_upload_config: { size_limit: 1 },
          },
        });
        const doImageUploadRequest = mockUploadApi();
        await renderComponent({
          messageInputProps: {
            doImageUploadRequest,
          },
        });
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        await act(() => {
          dropFile(file, formElement);
        });
        await waitFor(() => {
          expect(mockAddNotification).toHaveBeenCalledTimes(1);
          expect(mockAddNotification.mock.calls[0][0]).toContain('File is too large');
        });
      });

      it('should show attachment previews if at least one non-scraped attachments available', async () => {
        await renderComponent({
          messageInputProps: {
            message: { attachments: [{ type: 'xxx' }] },
          },
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
        await renderComponent({
          messageInputProps: {
            message: { attachments: [generateScrapedDataAttachment(), { type: 'xxx' }] },
          },
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
        await renderComponent({
          messageInputProps: {
            message: {},
          },
        });
        expect(
          screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('should not show attachment previews if no files uploaded and attachments available are only link previews', async () => {
        await renderComponent({
          messageInputProps: {
            message: { attachments: [generateScrapedDataAttachment()] },
          },
        });
        expect(
          screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('should not show attachment preview list if only failed uploads are available', async () => {
        const cause = new Error('failed to upload');
        const doFileUploadRequest = mockFaultyUploadApi(cause);

        await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
          },
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile();

        act(() => dropFile(file, formElement));

        await waitFor(() => {
          expect(
            screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
          ).not.toBeInTheDocument();
        });
      });

      it('should show attachment preview list if not only failed uploads are available', async () => {
        const cause = new Error('failed to upload');
        const doFileUploadRequest = jest
          .fn()
          .mockImplementationOnce(() => Promise.reject(cause))
          .mockImplementationOnce(() =>
            Promise.resolve({
              file: fileUploadUrl,
            }),
          );
        await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
          },
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile();

        await act(() => dropFile(file, formElement));

        await waitFor(() => {
          expect(screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID)).toBeInTheDocument();
          expect(screen.getByTestId(FILE_UPLOAD_RETRY_BTN_TEST_ID)).toBeInTheDocument();
        });

        await act(() => dropFile(file, formElement));

        await waitFor(() => {
          const previewList = screen.getByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID);
          expect(previewList).toBeInTheDocument();
          expect(previewList.children).toHaveLength(2);
        });
      });

      // TODO: Check if pasting plaintext is not prevented -> tricky because recreating exact event is hard
      // TODO: Remove image/file -> difficult because there is no easy selector and components are in react-file-utils
    });

    describe('Uploads disabled', () => {
      const channelData = { channel: { own_capabilities: [] } };

      it('pasting images and files should do nothing', async () => {
        const doImageUploadRequest = mockUploadApi();
        const doFileUploadRequest = mockUploadApi();
        const { container } = await renderComponent({
          channelData,
          messageInputProps: {
            doFileUploadRequest,
            doImageUploadRequest,
          },
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
          expect(doFileUploadRequest).not.toHaveBeenCalled();
          expect(doImageUploadRequest).not.toHaveBeenCalled();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should not upload an image when it is dropped on the dropzone', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { container } = await renderComponent({
          channelData,
          messageInputProps: {
            doImageUploadRequest,
          },
        });

        // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();

        act(() => {
          dropFile(file, formElement);
        });

        await waitFor(() => {
          expect(doImageUploadRequest).not.toHaveBeenCalled();
        });
        await waitFor(axeNoViolations(container));
      });
    });

    describe('Submitting', () => {
      it('should submit the input value when clicking the submit button', async () => {
        const { channel, container, submit } = await renderComponent();

        const messageText = 'Some text';

        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });

        await act(() => submit());

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining({
              text: messageText,
            }),
            {},
          );
        } else {
          expect(submitMock).toHaveBeenCalledWith(
            channel,
            expect.objectContaining({
              text: messageText,
            }),
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should allow to send custom message data', async () => {
        const customMessageData = { customX: 'customX' };
        const CustomInputForm = () => {
          const { handleChange, handleSubmit, value } = useMessageInputContext();
          return (
            <form>
              <input
                onChange={handleChange}
                placeholder={inputPlaceholder}
                value={value}
              />
              <button
                onClick={(event) => {
                  handleSubmit(event, customMessageData);
                }}
                type='submit'
              >
                Send
              </button>
            </form>
          );
        };

        const messageInputProps =
          componentName === 'EditMessageForm'
            ? {
                messageInputProps: {
                  message: {
                    text: `abc`,
                  },
                },
              }
            : {};

        const renderComponent = makeRenderFn(CustomInputForm);
        const { channel, container, submit } = await renderComponent(messageInputProps);

        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: 'Some text',
          },
        });

        await act(() => submit());

        await waitFor(() => {
          const isEdit = componentName === 'EditMessageForm';
          const calledMock = isEdit ? editMock : submitMock;
          expect(calledMock).toHaveBeenCalledWith(
            isEdit ? channel.cid : channel,
            expect.objectContaining(customMessageData),
            {},
          );
        });
        await axeNoViolations(container);
      });

      it('should use overrideSubmitHandler prop if it is defined', async () => {
        const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
        const customMessageData = undefined;
        const { channel, container, submit } = await renderComponent({
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
        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining({
              text: messageText,
            }),
            {},
          );
        } else {
          expect(overrideMock).toHaveBeenCalledWith(
            expect.objectContaining({
              text: messageText,
            }),
            channel.cid,
            customMessageData,
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should not do anything if the message is empty and has no files', async () => {
        const { container, submit } = await renderComponent({
          messageInputProps: { message: {} },
        });

        await act(() => submit());

        expect(
          componentName === 'EditMessageForm' ? editMock : submitMock,
        ).not.toHaveBeenCalled();
        await axeNoViolations(container);
      });

      it('should add image as attachment if a message is submitted with an image', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { channel, container, submit } = await renderComponent({
          messageInputProps: {
            doImageUploadRequest,
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();

        act(() => dropFile(file, formElement));

        // wait for image uploading to complete before trying to send the message

        await waitFor(() => expect(doImageUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        const msgFragment = {
          attachments: expect.arrayContaining([
            expect.objectContaining({
              image_url: fileUploadUrl,
              type: 'image',
            }),
          ]),
        };

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(msgFragment),
            {},
          );
        } else {
          expect(submitMock).toHaveBeenCalledWith(
            channel,
            expect.objectContaining(msgFragment),
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should add file as attachment if a message is submitted with a file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { channel, container, submit } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile();

        act(() => dropFile(file, formElement));

        // wait for file uploading to complete before trying to send the message

        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        const msgFragment = {
          attachments: expect.arrayContaining([
            expect.objectContaining({
              asset_url: fileUploadUrl,
              type: 'file',
            }),
          ]),
        };

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(msgFragment),
            {},
          );
        } else {
          expect(submitMock).toHaveBeenCalledWith(
            channel,
            expect.objectContaining(msgFragment),
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should add audio as attachment if a message is submitted with an audio file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { channel, container, submit } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = new File(['Message in a bottle'], 'the-police.mp3', {
          type: 'audio/mp3',
        });

        act(() => dropFile(file, formElement));

        // wait for file uploading to complete before trying to send the message

        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        const msgFragment = {
          attachments: expect.arrayContaining([
            expect.objectContaining({
              asset_url: fileUploadUrl,
              type: 'audio',
            }),
          ]),
        };

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(msgFragment),
            {},
          );
        } else {
          expect(submitMock).toHaveBeenCalledWith(
            channel,
            expect.objectContaining(msgFragment),
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should submit if shouldSubmit function is not provided but keydown events do match', async () => {
        const submitHandler = jest.fn();
        const { channel, container } = await renderComponent({
          messageInputProps: {
            overrideSubmitHandler: submitHandler,
          },
        });
        const input = await screen.findByPlaceholderText(inputPlaceholder);

        const messageText = 'Submission text.';
        await act(() =>
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          }),
        );

        await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

        const msgFragment = {
          text: messageText,
        };

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(msgFragment),
            {},
          );
        } else {
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining(msgFragment),
            channel.cid,
            undefined,
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should not submit if shouldSubmit function is provided but keydown events do not match', async () => {
        const submitHandler = jest.fn();
        const { container } = await renderComponent({
          messageInputProps: {
            overrideSubmitHandler: submitHandler,
            shouldSubmit: (e) => e.key === '9',
          },
        });
        const input = await screen.findByPlaceholderText(inputPlaceholder);

        const messageText = 'Submission text.';
        await act(() =>
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          }),
        );

        await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

        expect(submitHandler).not.toHaveBeenCalled();
        await axeNoViolations(container);
      });

      it('should submit if shouldSubmit function is provided and keydown events do match', async () => {
        const submitHandler = jest.fn();

        const { channel, container } = await renderComponent({
          messageInputProps: {
            overrideSubmitHandler: submitHandler,
            shouldSubmit: (e) => e.key === '9',
          },
        });
        const messageText = 'Submission text.';
        const input = await screen.findByPlaceholderText(inputPlaceholder);

        await act(() => {
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          });

          fireEvent.keyDown(input, {
            key: '9',
          });
        });

        const msgFragment = {
          text: messageText,
        };

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            channel.cid,
            expect.objectContaining(msgFragment),
            {},
          );
        } else {
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining(msgFragment),
            channel.cid,
            undefined,
            {},
          );
        }

        await axeNoViolations(container);
      });

      it('should not submit if Shift key is pressed', async () => {
        const submitHandler = jest.fn();

        const { container } = await renderComponent({
          messageInputProps: {
            overrideSubmitHandler: submitHandler,
          },
        });
        const messageText = 'Submission text.';
        const input = await screen.findByPlaceholderText(inputPlaceholder);

        await act(() => {
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          });

          fireEvent.keyDown(input, {
            key: 'Enter',
            shiftKey: true,
          });
        });

        expect(submitHandler).not.toHaveBeenCalled();

        await axeNoViolations(container);
      });
    });

    it('should edit a message if it is passed through the message prop', async () => {
      const file = {
        asset_url: 'somewhere.txt',
        file_size: 1000,
        mime_type: 'text/plain',
        title: 'title',
        type: 'file',
      };
      const image = {
        fallback: 'fallback.png',
        image_url: 'somewhere.png',
        type: 'image',
      };
      const mentioned_users = [{ id: userId, name: username }];

      const message = generateMessage({
        attachments: [file, image],
        mentioned_users,
        text: `@${username} what's up!`,
      });
      const { channel, container, submit } = await renderComponent({
        messageInputProps: {
          clearEditingState: () => {},
          message,
        },
      });

      await act(() => submit());

      expect(editMock).toHaveBeenCalledWith(
        channel.cid,
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining(image),
            expect.objectContaining(file),
          ]),
          mentioned_users: [{ id: userId, name: username }],
          text: message.text,
        }),
        {},
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should list all the available users to mention if only @ is typed', async () => {
      const { channel } = await renderComponent({ customUser: generateUser() });

      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      await act(() => {
        fireEvent.change(formElement, {
          target: {
            selectionEnd: 1,
            value: '@',
          },
        });
      });

      const usernameList = screen.getAllByTestId('user-item-name');
      expect(usernameList).toHaveLength(Object.keys(channel.state.members).length);
    });

    it('should add a mentioned user if @ is typed and a user is selected', async () => {
      const { channel, container, submit } = await renderComponent();

      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      await act(() => {
        fireEvent.change(formElement, {
          target: {
            selectionEnd: 1,
            value: '@',
          },
        });
      });

      const usernameListItem = await screen.getByTestId('user-item-name');
      expect(usernameListItem).toBeInTheDocument();

      await act(() => {
        fireEvent.click(usernameListItem);
      });

      await act(() => submit());

      if (componentName === 'EditMessageForm') {
        expect(editMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            ...mainListMessage,
            created_at: expect.any(Date),
            mentioned_users: [
              {
                banned: false,
                created_at: '2020-04-27T13:39:49.331742Z',
                id: 'mention-id',
                image: expect.any(String),
                name: 'mention-name',
                online: false,
                role: 'user',
                updated_at: '2020-04-27T13:39:49.332087Z',
              },
            ],
            text: '@mention-name ',
            updated_at: expect.any(Date),
          }),
          {},
        );
      } else {
        expect(submitMock).toHaveBeenCalledWith(
          channel,
          expect.objectContaining({
            mentioned_users: expect.arrayContaining([mentionId]),
          }),
          {},
        );
      }
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should remove mentioned users if they are no longer mentioned in the message text', async () => {
      const { channel, container, submit } = await renderComponent({
        messageInputProps: {
          message: {
            mentioned_users: [{ id: userId, name: username }],
            text: `@${username}`,
          },
        },
      });
      // remove all text from input
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      await act(() => {
        fireEvent.change(formElement, {
          target: {
            selectionEnd: 1,
            value: 'no mentioned users',
          },
        });
      });

      await act(() => submit());

      expect(editMock).toHaveBeenCalledWith(
        channel.cid,
        expect.objectContaining({
          mentioned_users: [],
        }),
        {},
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should override the default List component when SuggestionList is provided as a prop', async () => {
      const AutocompleteSuggestionList = () => (
        <div data-testid='suggestion-list'>Suggestion List</div>
      );

      const { container } = await renderComponent({
        channelProps: { AutocompleteSuggestionList },
      });

      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      await waitFor(() =>
        expect(screen.queryByText('Suggestion List')).not.toBeInTheDocument(),
      );

      act(() => {
        fireEvent.change(formElement, {
          target: { value: '/' },
        });
      });

      if (componentName !== 'EditMessageForm') {
        await waitFor(() =>
          expect(screen.getByTestId('suggestion-list')).toBeInTheDocument(),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('EditMessageForm only', () => {
  afterEach(tearDown);

  const renderComponent = makeRenderFn(EditMessageForm);

  it('should render file upload button disabled', async () => {
    const channelData = { channel: { own_capabilities: [] } };
    const { container } = await renderComponent({
      channelData,
    });
    await waitFor(() => expect(screen.getByTestId(FILE_INPUT_TEST_ID)).toBeDisabled());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

const initQuotedMessagePreview = async (message) => {
  await waitFor(() => expect(screen.queryByText(message.text)).not.toBeInTheDocument());

  const quoteButton = await screen.findByText(/^reply$/i);
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

describe(`MessageInputFlat only`, () => {
  afterEach(tearDown);

  const renderComponent = makeRenderFn(MessageInputFlat);

  it('should contain default message text if provided', async () => {
    const defaultValue = nanoid();
    await renderComponent({
      messageInputProps: {
        additionalTextareaProps: { defaultValue },
      },
    });
    await waitFor(() => {
      const textarea = screen.queryByDisplayValue(defaultValue);
      expect(textarea).toBeInTheDocument();
    });
  });

  it('should prefer value from getDefaultValue before additionalTextareaProps.defaultValue', async () => {
    const defaultValue = nanoid();
    const generatedDefaultValue = nanoid();
    const getDefaultValue = () => generatedDefaultValue;
    await renderComponent({
      messageInputProps: {
        additionalTextareaProps: { defaultValue },
        getDefaultValue,
      },
    });
    await waitFor(() => {
      const textarea = screen.queryByDisplayValue(generatedDefaultValue);
      expect(textarea).toBeInTheDocument();
    });
  });

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
        channelProps: {
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
        channelProps: { QuotedPoll },
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

    it('should be rendered when editing a message', async () => {
      await renderComponent({ messageInputProps: { message: generateMessage() } });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeInTheDocument();
    });

    it('should not be renderer during active cooldown period', async () => {
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
      fireEvent.change(screen.getByPlaceholderText(inputPlaceholder), {
        target: {
          value: 'X',
        },
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeEnabled();
    });
    it('should be enabled if there are uploads to be submitted', async () => {
      await renderComponent({
        messageInputProps: {
          doFileUploadRequest: mockUploadApi(),
        },
      });
      const file = getFile();

      await act(() => {
        fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
          target: {
            files: [file],
          },
        });
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeEnabled();
    });
    it('should be enabled if there are attachments to be submitted', async () => {
      await renderComponent({
        messageInputProps: {
          message: { attachments: [{}] },
        },
      });
      expect(screen.getByTestId(SEND_BTN_TEST_ID)).toBeEnabled();
    });
    it.todo('should not be enabled if there are failed attachments only');
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
});

describe('Message drafts', () => {
  afterEach(tearDown);

  const renderComponent = makeRenderFn(MessageInputFlat);
  // todo: thread

  describe.each([
    [
      'enabled',
      {
        channelProps: { messageDraftsEnabled: true },
        messageInputProps: { message: undefined },
      },
    ],
    [
      'disabled',
      {
        channelProps: { messageDraftsEnabled: undefined },
        messageInputProps: { message: undefined },
      },
    ],
    [
      'editing message',
      {
        channelProps: { messageDraftsEnabled: true },
        messageInputProps: { message: generateMessage() },
      },
    ],
  ])('%s', (scenario, { channelProps, messageInputProps }) => {
    const channelData = generateChannel();
    channelData.draft = generateMessageDraft({
      channel_cid: channelData.channel.cid,
    });

    it('initiates with draft', async () => {
      const channelData = generateChannel({
        channel: { own_capabilities: ['upload-file'] },
      });
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({
          attachments: [generateFileAttachment()],
          mentioned_users: ['Y'],
          quoted_message_id: mainListMessage.id,
        }),
        quoted_message: mainListMessage,
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      const filePreview = screen.queryByTestId(FILE_PREVIEW_TEST_ID);
      if (scenario === 'enabled') {
        expect(textarea.value).toBe(channelData.draft.message.text);
        await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
        expect(
          screen.getByText(channelData.draft.message.attachments[0].title),
        ).toBeInTheDocument();
        await waitFor(() => {
          expect(filePreview.querySelector('a')).toHaveAttribute(
            'href',
            channelData.draft.message.attachments[0].asset_url,
          );
        });
        // todo: check mentioned users
      } else if (scenario === 'disabled') {
        expect(textarea.value).toBe('');
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      } else if (scenario === 'editing message') {
        expect(textarea.value).toBe(messageInputProps.message.text);
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      }
    });

    it('stores draft on unmount if at least text is not empty', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      const updatedDraftText = 'X';

      await act(async () => {
        await fireEvent.change(textarea, {
          target: {
            value: updatedDraftText,
          },
        });
      });

      unmount();

      if (scenario === 'enabled') {
        expect(channel.draftMessage).toHaveBeenCalledWith(
          expect.objectContaining({ text: updatedDraftText }),
        );
      } else {
        expect(channel.draftMessage).not.toHaveBeenCalled();
      }
    });

    it('stores draft on unmount if at least one attachment uploaded', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
      });
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps: {
          ...messageInputProps,
          doFileUploadRequest: mockUploadApi(),
        },
      });
      const file = getFile();
      const input = screen.getByTestId(FILE_INPUT_TEST_ID);

      await act(() => {
        fireEvent.change(input, {
          target: {
            files: [file],
          },
        });
      });

      unmount();

      if (scenario === 'enabled') {
        expect(channel.draftMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            attachments: [
              {
                asset_url: fileUploadUrl,
                file_size: 7,
                mime_type: 'text/plain',
                title: 'some.txt',
                type: 'file',
              },
            ],
          }),
        );
      } else {
        expect(channel.draftMessage).not.toHaveBeenCalled();
      }
    });

    it('stores draft on unmount if quoted message exists', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      await initQuotedMessagePreview(mainListMessage);

      unmount();

      if (scenario === 'enabled') {
        expect(channel.draftMessage).toHaveBeenCalledWith(
          expect.objectContaining({ quoted_message_id: mainListMessage.id }),
        );
      } else {
        expect(channel.draftMessage).not.toHaveBeenCalled();
      }
    });

    it('does not store unchanged draft on unmount', async () => {
      const channelData = generateChannel({
        channel: { own_capabilities: ['upload-file'] },
      });
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({
          attachments: [generateFileAttachment()],
          quoted_message_id: mainListMessage.id,
        }),
        quoted_message: mainListMessage,
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      unmount();

      expect(channel.draftMessage).not.toHaveBeenCalled();
    });

    it('overrides the draft with WS event draft.updated payload', async () => {
      const channelData = generateChannel({
        channel: { own_capabilities: ['upload-file'] },
      });
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({
          attachments: [generateFileAttachment()],
          quoted_message_id: mainListMessage.id,
        }),
        quoted_message: mainListMessage,
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });
      const updatedDraft = generateMessageDraft({
        channel_cid: channel.cid,
        message: generateMessage({
          attachments: [generateFileAttachment()],
          mentioned_users: ['X'],
          quoted_message_id: mainListMessage.id,
        }),
        quoted_message: mainListMessage,
      });
      await act(() => {
        dispatchDraftUpdated({ client, draft: updatedDraft });
      });
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      const filePreview = screen.queryByTestId(FILE_PREVIEW_TEST_ID);
      if (scenario === 'enabled') {
        expect(textarea.value).toBe(updatedDraft.message.text);
        await quotedMessagePreviewIsDisplayedCorrectly(mainListMessage);
        expect(
          screen.getByText(updatedDraft.message.attachments[0].title),
        ).toBeInTheDocument();
        await waitFor(() => {
          expect(filePreview.querySelector('a')).toHaveAttribute(
            'href',
            updatedDraft.message.attachments[0].asset_url,
          );
        });
        // todo: check mentioned users
      } else if (scenario === 'disabled') {
        expect(textarea.value).toBe('');
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      } else if (scenario === 'editing message') {
        expect(textarea.value).toBe(messageInputProps.message.text);
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      }
    });

    it('removes the draft with WS event draft.deleted', async () => {
      const channelData = generateChannel({
        channel: { own_capabilities: ['upload-file'] },
      });
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({
          attachments: [generateFileAttachment()],
          quoted_message_id: mainListMessage.id,
        }),
        quoted_message: mainListMessage,
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      await act(() => {
        dispatchDraftDeleted({ client, draft: channelData.draft });
      });
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      const filePreview = screen.queryByTestId(FILE_PREVIEW_TEST_ID);
      if (scenario === 'editing message') {
        expect(textarea.value).toBe(messageInputProps.message.text);
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      } else {
        expect(textarea.value).toBe('');
        expect(filePreview).not.toBeInTheDocument();
        expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
      }
    });

    it('removes draft on text clear if no attachments and no quoted message', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      jest.spyOn(channel, 'deleteMessageDraft').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });
      const textarea = screen.getByPlaceholderText(inputPlaceholder);
      const updatedDraftText = '';

      await act(async () => {
        await fireEvent.change(textarea, {
          target: {
            value: updatedDraftText,
          },
        });
      });

      unmount();

      if (scenario === 'enabled') {
        expect(channel.draftMessage).not.toHaveBeenCalled();
        expect(channel.deleteMessageDraft).toHaveBeenCalledWith(
          expect.objectContaining({}),
        );
      } else {
        expect(channel.draftMessage).not.toHaveBeenCalled();
        expect(channel.deleteMessageDraft).not.toHaveBeenCalled();
      }
    });

    it('removes the draft if quoted message removed', async () => {
      if (scenario !== 'enabled') return; // when the initial draft is disregarded, there is no quoted message preview

      const channelData = generateChannel();
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({
          attachments: [],
          quoted_message_id: mainListMessage.id,
          text: '',
        }),
        quoted_message: mainListMessage,
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      jest.spyOn(channel, 'deleteMessageDraft').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      if (scenario === 'enabled') {
        await act(async () => {
          await fireEvent.click(screen.getByLabelText('aria/Cancel Reply'));
        });
      }

      unmount();

      expect(channel.draftMessage).not.toHaveBeenCalled();
      expect(channel.deleteMessageDraft).toHaveBeenCalledWith(
        expect.objectContaining({}),
      );
    });

    it('removes draft on last attachment removal if no text and no quoted message', async () => {
      if (scenario !== 'enabled') return; // when the initial draft is disregarded, there is no attachment preview

      const channelData = generateChannel({
        channel: { own_capabilities: ['upload-file'] },
      });
      channelData.draft = generateMessageDraft({
        channel_cid: channelData.channel.cid,
        message: generateMessage({ attachments: [generateFileAttachment()], text: '' }),
      });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({ channelsData: [channelData] });
      jest.spyOn(channel, 'draftMessage').mockImplementationOnce();
      jest.spyOn(channel, 'deleteMessageDraft').mockImplementationOnce();
      const { unmount } = await renderComponent({
        channelProps,
        customChannel: channel,
        customClient: client,
        messageInputProps,
      });

      await act(async () => {
        await fireEvent.click(screen.getByLabelText('aria/Remove attachment'));
      });

      unmount();

      expect(channel.draftMessage).not.toHaveBeenCalled();
      expect(channel.deleteMessageDraft).toHaveBeenCalledWith(
        expect.objectContaining({}),
      );
    });
  });
});
