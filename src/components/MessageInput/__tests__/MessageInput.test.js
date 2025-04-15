import React, { useEffect } from 'react';
import { LinkPreview, SearchController } from 'stream-chat';
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
import { ChatProvider } from '../../../context/ChatContext';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateFileAttachment,
  generateLocalAttachmentData,
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
import { useMessageComposer } from '../hooks';

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
    type: 'messaging',
    id: 'general',
    own_capabilities: ['send-poll', 'upload-file'],
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

const mockUploadApi = () =>
  jest.fn().mockImplementation(() =>
    Promise.resolve({
      file: fileUploadUrl,
    }),
  );

const sendMessageMock = jest.fn();
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
    CustomStateSetter = null,
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
            {InputComponent.name === 'EditMessageForm' ? (
              <MessageProvider
                value={{
                  ...defaultMessageContextValue,
                  editing: true,
                  ...messageContextOverrides,
                }}
              >
                {CustomStateSetter && <CustomStateSetter />}
                <MessageInput Input={InputComponent} {...messageInputProps} />
              </MessageProvider>
            ) : (
              <>
                <MessageProvider
                  value={{ ...defaultMessageContextValue, ...messageContextOverrides }}
                >
                  <MessageActionsBox
                    {...messageActionsBoxProps}
                    getMessageActions={defaultMessageContextValue.getMessageActions}
                  />
                </MessageProvider>
                <MessageInput Input={InputComponent} {...messageInputProps} />
              </>
            )}
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
      await renderComponent();
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
          filenameTexts.forEach((filenameText) =>
            expect(filenameText).toBeInTheDocument(),
          );
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

      it('should call error handler if an image failed to upload', async () => {
        const cause = new Error('failed to upload');
        const { customChannel, customClient, sendImageSpy } =
          await setupUploadRejected(cause);
        const { container } = await renderComponent({
          customChannel,
          customClient,
        });
        jest.spyOn(console, 'error').mockImplementationOnce(() => null);
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();

        act(() => {
          dropFile(file, formElement);
        });

        await waitFor(() => {
          expect(sendImageSpy).toHaveBeenCalledTimes(1);
          expect(sendImageSpy).toHaveBeenCalledWith(file);
        });
        await axeNoViolations(container);
      });

      // todo: JSDOM implementation used in Jest uses custom File mock that is different from that used in browser / node -> this
      it.skip('should call error handler if a file failed to upload and allow retrying', async () => {
        const cause = new Error('failed to upload');
        const { customChannel, customClient, sendFileSpy } =
          await setupUploadRejected(cause);

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
      it('should only allow dropping max number of files files into the dropzone', async () => {
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

        await waitFor(() =>
          expect(screen.queryByText(filename2)).not.toBeInTheDocument(),
        );

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
          previews: new Map([
            [linkPreviewData.og_scrape_url, new LinkPreview({ data: linkPreviewData })],
          ]),
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
          expect(
            screen.queryByTestId(ATTACHMENT_PREVIEW_LIST_TEST_ID),
          ).toBeInTheDocument();
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

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            customChannel.cid,
            expect.objectContaining({
              text: mainListMessage.text,
            }),
            {},
          );
        } else {
          expect(sendMessageMock).toHaveBeenCalledWith(
            customChannel,
            expect.objectContaining({
              text: messageText,
            }),
            {},
          );
        }
        await axeNoViolations(container);
      });

      it('should allow to send custom message data', async () => {
        const { customChannel, customClient } = await setup();
        const customMessageData = { customX: 'customX' };
        const isEdit = componentName === 'EditMessageForm';
        let CustomStateSetter = null;
        if (isEdit) {
          CustomStateSetter = () => {
            const composer = useMessageComposer();
            useEffect(() => {
              composer.customDataManager.setData(customMessageData);
            }, [composer]);
          };
        } else {
          customChannel.messageComposer.customDataManager.setData(customMessageData);
        }
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
          const calledMock = isEdit ? editMock : sendMessageMock;
          expect(calledMock).toHaveBeenCalledWith(
            isEdit ? customChannel.cid : customChannel,
            expect.objectContaining(customMessageData),
            {},
          );
        });
        await axeNoViolations(container);
      });

      it('should use overrideSubmitHandler prop if it is defined but not when editing', async () => {
        const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
        const { customChannel, customClient } = await setup();
        const customMessageData = { customX: 'customX' };
        const isEdit = componentName === 'EditMessageForm';
        let CustomStateSetter = null;
        if (isEdit) {
          CustomStateSetter = () => {
            const composer = useMessageComposer();
            useEffect(() => {
              composer.customDataManager.setData(customMessageData);
            }, [composer]);
          };
        } else {
          customChannel.messageComposer.customDataManager.setData(customMessageData);
        }
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
        if (componentName === 'EditMessageForm') {
          expect(overrideMock).not.toHaveBeenCalled();
        } else {
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
        }
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

        expect(
          componentName === 'EditMessageForm' ? editMock : sendMessageMock,
        ).not.toHaveBeenCalled();
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
          if (componentName === 'EditMessageForm') {
            // todo: why handleSubmit function is not called on click?
            // expect(editMock).toHaveBeenCalledWith(
            //   customChannel.cid,
            //   expect.objectContaining(msgFragment),
            //   {},
            // );
          } else {
            expect(sendMessageMock).toHaveBeenCalledWith(
              customChannel,
              expect.objectContaining(msgFragment),
              {},
            );
          }
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
        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });

        await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

        if (componentName === 'EditMessageForm') {
          expect(editMock).toHaveBeenCalledWith(
            customChannel.cid,
            expect.objectContaining({
              text: mainListMessage.text,
            }),
            {},
          );
        } else {
          expect(sendMessageMock).toHaveBeenCalledWith(
            customChannel,
            expect.objectContaining({
              text: messageText,
            }),
            {},
          );
        }

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
        expect(sendMessageMock).toHaveBeenCalledWith(
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
