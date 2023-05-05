import React, { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { nanoid } from 'nanoid';

import { MessageInput } from '../MessageInput';
import { MessageInputFlat } from '../MessageInputFlat';
import { MessageInputSmall } from '../MessageInputSmall';
import { EditMessageForm } from '../EditMessageForm';

import { Chat } from '../../Chat/Chat';
import { Channel } from '../../Channel/Channel';
import { MessageActionsBox } from '../../MessageActions';

import { MessageProvider } from '../../../context/MessageContext';
import { useMessageInputContext } from '../../../context/MessageInputContext';
import { useChatContext } from '../../../context/ChatContext';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

expect.extend(toHaveNoViolations);

jest.mock('../../Channel/utils', () => ({ makeAddNotifications: jest.fn }));

let chatClient;
let channel;

const inputPlaceholder = 'Type your message';
const userId = 'userId';
const username = 'username';
const mentionId = 'mention-id';
const mentionName = 'mention-name';
const user1 = generateUser({ id: userId, name: username });
const mentionUser = generateUser({
  id: mentionId,
  name: mentionName,
});
const mainListMessage = generateMessage({ user: user1 });
const threadMessage = generateMessage({
  parent_id: mainListMessage.id,
  type: 'reply',
  user: user1,
});
const mockedChannel = generateChannel({
  members: [generateMember({ user: user1 }), generateMember({ user: mentionUser })],
  messages: [mainListMessage],
  thread: [threadMessage],
});

const filename = 'some.txt';
const fileUploadUrl = 'http://www.getstream.io'; // real url, because ImagePreview will try to load the image

const getImage = () => new File(['content'], filename, { type: 'image/png' });
const getFile = (name = filename) => new File(['content'], name, { type: 'text/plain' });

const mockUploadApi = () =>
  jest.fn().mockImplementation(() =>
    Promise.resolve({
      file: fileUploadUrl,
    }),
  );

const mockFaultyUploadApi = (cause) => jest.fn().mockImplementation(() => Promise.reject(cause));

const submitMock = jest.fn();
const editMock = jest.fn();

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

const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useChatContext();
  useEffect(() => {
    setActiveChannel(activeChannel);
  }, [activeChannel]);
  return null;
};

const makeRenderFn = (InputComponent) => async ({
  messageInputProps = {},
  channelProps = {},
  messageContextOverrides = {},
  messageActionsBoxProps = {},
} = {}) => {
  let renderResult;
  await act(() => {
    renderResult = render(
      <Chat client={chatClient}>
        <ActiveChannelSetter activeChannel={channel} />
        <Channel
          doSendMessageRequest={submitMock}
          doUpdateMessageRequest={editMock}
          {...channelProps}
        >
          <MessageProvider value={{ ...defaultMessageContextValue, ...messageContextOverrides }}>
            <MessageActionsBox
              {...messageActionsBoxProps}
              getMessageActions={defaultMessageContextValue.getMessageActions}
            />
          </MessageProvider>
          <MessageInput Input={InputComponent} {...messageInputProps} />
        </Channel>
      </Chat>,
    );
  });

  const submit = async () => {
    const submitButton = renderResult.findByText('Send') || renderResult.findByTitle('Send');
    fireEvent.click(await submitButton);
  };

  return { submit, ...renderResult };
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
  { InputComponent: MessageInputSmall, name: 'MessageInputSmall' },
  { InputComponent: MessageInputFlat, name: 'MessageInputFlat' },
  { InputComponent: EditMessageForm, name: 'EditMessageForm' },
].forEach(({ InputComponent, name: componentName }) => {
  const renderComponent = makeRenderFn(InputComponent);

  describe(`${componentName}`, () => {
    beforeEach(async () => {
      chatClient = await getTestClientWithUser({ id: user1.id });
      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      channel = chatClient.channel('messaging', mockedChannel.id);
    });
    afterEach(tearDown);

    it('should contain placeholder text if no default message text provided', async () => {
      await renderComponent();
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(inputPlaceholder);
        expect(textarea).toBeInTheDocument();
        expect(textarea.value).toBe('');
      });
    });

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

    it('Should shift focus to the textarea if the `focus` prop is true', async () => {
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

    it('Should render default emoji svg', async () => {
      const { container } = await renderComponent();
      const emojiIcon = await screen.findByTitle('Open emoji picker');

      await waitFor(() => {
        expect(emojiIcon).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should render custom emoji svg provided as prop', async () => {
      const EmojiIcon = () => (
        <svg>
          <title>NotEmoji</title>
        </svg>
      );

      const { container } = await renderComponent({ channelProps: { EmojiIcon } });

      const emojiIcon = await screen.findByTitle('NotEmoji');

      await waitFor(() => {
        expect(emojiIcon).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should render default file upload icon', async () => {
      const { container } = await renderComponent();
      const fileUploadIcon = await screen.findByTitle('Attach files');

      await waitFor(() => {
        expect(fileUploadIcon).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should render custom file upload svg provided as prop', async () => {
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

    it('Should open the emoji picker after clicking the icon, and allow adding emojis to the message', async () => {
      const { container } = await renderComponent();

      const emojiIcon = await screen.findByTitle('Open emoji picker');

      act(() => fireEvent.click(emojiIcon));

      await waitFor(() => {
        expect(container.querySelector('.emoji-mart')).toBeInTheDocument();
      });

      const emoji = '💯';
      const emojiButton = screen.queryAllByText(emoji)[0];
      expect(emojiButton).toBeInTheDocument();
      act(() => fireEvent.click(emojiButton));

      // expect input to have emoji as value
      expect(screen.getByDisplayValue(emoji)).toBeInTheDocument();

      // close picker
      act(() => fireEvent.click(container));
      expect(container.querySelector('.emoji-mart')).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    describe('Attachments', () => {
      it('Pasting images and files should result in uploading the files and showing previewers', async () => {
        // FIXME: act is missing somewhere within this test which results in unwanted warning

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
          expect(filenameText).toBeInTheDocument();
          expect(filenameText.closest('a')).toHaveAttribute('href', fileUploadUrl);
          expect(doImageUploadRequest).toHaveBeenCalledWith(image, expect.any(Object));
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
        await waitFor(() => {
          expect(filenameText.closest('a')).toHaveAttribute('href', fileUploadUrl);
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
        const input = (await screen.findByTestId('fileinput')).querySelector('input');

        act(() => {
          fireEvent.change(input, {
            target: {
              files: [file],
            },
          });
        });

        const filenameText = await screen.findByText(filename);

        expect(filenameText).toBeInTheDocument();
        await waitFor(() => {
          expect(filenameText.closest('a')).toHaveAttribute('href', fileUploadUrl);
        });
        await axeNoViolations(container);
      });

      it('Should call error handler if an image failed to upload', async () => {
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
          expect(errorHandler).toHaveBeenCalledWith(cause, 'upload-image', expect.any(Object));
          expect(doImageUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        await axeNoViolations(container);
      });

      it('Should call error handler if a file failed to upload and allow retrying', async () => {
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
          expect(errorHandler).toHaveBeenCalledWith(cause, 'upload-file', expect.any(Object));
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });

        doFileUploadRequest.mockImplementationOnce(() => Promise.resolve({ file }));

        await act(async () => {
          fireEvent.click(await screen.findByText('retry'));
        });

        await waitFor(() =>
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object)),
        );
        await axeNoViolations(container);
      });

      it('should not set multiple attribute on the file input if multipleUploads is false', async () => {
        const { container } = await renderComponent({
          channelProps: {
            multipleUploads: false,
          },
        });
        const input = (await screen.findByTestId('fileinput')).querySelector('input');
        expect(input).not.toHaveAttribute('multiple');
        await axeNoViolations(container);
      });

      it('should set multiple attribute on the file input if multipleUploads is true', async () => {
        const { container } = await renderComponent({
          channelProps: {
            multipleUploads: true,
          },
        });
        const input = (await screen.findByTestId('fileinput')).querySelector('input');
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

        await waitFor(() => expect(screen.queryByText(filename2)).not.toBeInTheDocument());

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
        await waitFor(() => expect(screen.queryByText(filename2)).not.toBeInTheDocument());
        await axeNoViolations(container);
      });

      // TODO: Check if pasting plaintext is not prevented -> tricky because recreating exact event is hard
      // TODO: Remove image/file -> difficult because there is no easy selector and components are in react-file-utils
    });

    describe('Uploads disabled in Channel config', () => {
      let originalConfig;
      beforeEach(() => {
        originalConfig = channel.getConfig;
        channel.getConfig = () => ({ uploads: false });
      });
      afterAll(() => {
        channel.getConfig = originalConfig;
      });

      it('should not render file upload button', async () => {
        const { container } = await renderComponent();
        await waitFor(() => expect(screen.queryByTestId('fileinput')).not.toBeInTheDocument());
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Pasting images and files should do nothing', async () => {
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

        const clipboardEvent = new Event('paste', { bubbles: true });
        // set `clipboardData`. Mock DataTransfer object
        clipboardEvent.clipboardData = {
          items: [
            { getAsFile: () => file, kind: 'file' },
            { getAsFile: () => image, kind: 'file' },
          ],
        };
        const formElement = await screen.findByPlaceholderText(inputPlaceholder);

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
      it('Should submit the input value when clicking the submit button', async () => {
        const { container, submit } = await renderComponent();

        const messageText = 'Some text';

        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });

        await act(() => submit());

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            text: messageText,
          }),
        );
        await axeNoViolations(container);
      });

      it('should allow to send custom message data', async () => {
        const customMessageData = { customX: 'customX' };
        const CustomInputForm = () => {
          const { handleChange, handleSubmit, value } = useMessageInputContext();
          return (
            <form>
              <input onChange={handleChange} placeholder={inputPlaceholder} value={value} />
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
        const { container, submit } = await renderComponent(messageInputProps);

        fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
          target: {
            value: 'Some text',
          },
        });

        await act(() => submit());

        await waitFor(() => {
          const calledMock = componentName === 'EditMessageForm' ? editMock : submitMock;
          expect(calledMock).toHaveBeenCalledWith(
            expect.stringMatching(/.+:.+/),
            expect.objectContaining(customMessageData),
          );
        });
        await axeNoViolations(container);
      });

      it('Should use overrideSubmitHandler prop if it is defined', async () => {
        const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
        const customMessageData = undefined;
        const { container, submit } = await renderComponent({
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
            text: messageText,
          }),
          channel.cid,
          customMessageData,
        );
        await axeNoViolations(container);
      });

      it('Should not do anything if the message is empty and has no files', async () => {
        const { container, submit } = await renderComponent();

        await act(() => submit());

        expect(submitMock).not.toHaveBeenCalled();
        await axeNoViolations(container);
      });

      it('should add image as attachment if a message is submitted with an image', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { container, submit } = await renderComponent({
          messageInputProps: {
            doImageUploadRequest,
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getImage();

        act(() => dropFile(file, formElement));

        // wait for image uploading to complete before trying to send the message
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doImageUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            attachments: expect.arrayContaining([
              expect.objectContaining({
                image_url: fileUploadUrl,
                type: 'image',
              }),
            ]),
          }),
        );
        await axeNoViolations(container);
      });

      it('should add file as attachment if a message is submitted with a file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { container, submit } = await renderComponent({
          messageInputProps: {
            doFileUploadRequest,
          },
        });

        const formElement = await screen.findByPlaceholderText(inputPlaceholder);
        const file = getFile();

        act(() => dropFile(file, formElement));

        // wait for file uploading to complete before trying to send the message
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            attachments: expect.arrayContaining([
              expect.objectContaining({
                asset_url: fileUploadUrl,
                type: 'file',
              }),
            ]),
          }),
        );
        await axeNoViolations(container);
      });

      it('should add audio as attachment if a message is submitted with an audio file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { container, submit } = await renderComponent({
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
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());

        await act(() => submit());

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            attachments: expect.arrayContaining([
              expect.objectContaining({
                asset_url: fileUploadUrl,
                type: 'audio',
              }),
            ]),
          }),
        );
        await axeNoViolations(container);
      });

      it('should submit if shouldSubmit function is not provided but keydown events do match', async () => {
        const submitHandler = jest.fn();
        const { container } = await renderComponent({
          messageInputProps: {
            overrideSubmitHandler: submitHandler,
          },
        });
        const input = await screen.findByPlaceholderText(inputPlaceholder);

        const messageText = 'Submission text.';
        act(() =>
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          }),
        );

        act(() => fireEvent.keyDown(input, { key: 'Enter' }));

        expect(submitHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            text: messageText,
          }),
          channel.cid,
          undefined,
        );
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
        act(() =>
          fireEvent.change(input, {
            target: {
              value: messageText,
            },
          }),
        );

        act(() => fireEvent.keyDown(input, { key: 'Enter' }));

        expect(submitHandler).not.toHaveBeenCalled();
        await axeNoViolations(container);
      });

      it('should submit if shouldSubmit function is provided and keydown events do match', async () => {
        const submitHandler = jest.fn();

        const { container } = await renderComponent({
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

        expect(submitHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            text: messageText,
          }),
          channel.cid,
          undefined,
        );

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

    it('Should edit a message if it is passed through the message prop', async () => {
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
      const { container, submit } = await renderComponent({
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
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should add a mentioned user if @ is typed and a user is selected', async () => {
      const { container, submit } = await renderComponent();

      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      act(() => {
        fireEvent.change(formElement, {
          target: {
            selectionEnd: 1,
            value: '@',
          },
        });
      });

      const usernameListItem = await screen.getByTestId('user-item-name');
      expect(usernameListItem).toBeInTheDocument();

      act(() => {
        fireEvent.click(usernameListItem);
      });

      await act(() => submit());

      expect(submitMock).toHaveBeenCalledWith(
        channel.cid,
        expect.objectContaining({
          mentioned_users: expect.arrayContaining([mentionId]),
        }),
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should remove mentioned users if they are no longer mentioned in the message text', async () => {
      const { container, submit } = await renderComponent({
        messageInputProps: {
          message: {
            mentioned_users: [{ id: userId, name: username }],
            text: `@${username}`,
          },
        },
      });
      // remove all text from input
      const formElement = await screen.findByPlaceholderText(inputPlaceholder);

      act(() => {
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

      await waitFor(() => expect(screen.queryByText('Suggestion List')).not.toBeInTheDocument());

      act(() => {
        fireEvent.change(formElement, {
          target: { value: '/' },
        });
      });

      if (componentName !== 'EditMessageForm') {
        await waitFor(
          () => expect(screen.getByTestId('suggestion-list')).toBeInTheDocument(), // eslint-disable-line
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

[
  { InputComponent: MessageInputSmall, name: 'MessageInputSmall' },
  { InputComponent: MessageInputFlat, name: 'MessageInputFlat' },
].forEach(({ InputComponent, name: componentName }) => {
  const renderComponent = makeRenderFn(InputComponent);

  describe(`${componentName}`, () => {
    beforeEach(async () => {
      chatClient = await getTestClientWithUser({ id: user1.id });
      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      channel = chatClient.channel('messaging', mockedChannel.id);
    });

    afterEach(tearDown);

    const render = async () => {
      const message =
        componentName === 'MessageInputSmall' ? threadMessage : defaultMessageContextValue.message;

      await renderComponent({
        messageContextOverrides: { message },
      });

      return message;
    };

    const initQuotedMessagePreview = async (message) => {
      await waitFor(() => expect(screen.queryByText(message.text)).not.toBeInTheDocument());

      const quoteButton = await screen.findByText(/^reply$/i);
      await waitFor(() => expect(quoteButton).toBeInTheDocument());

      act(() => {
        fireEvent.click(quoteButton);
      });
    };

    const quotedMessagePreviewIsDisplayedCorrectly = async (message) => {
      await waitFor(() => expect(screen.queryByText(/reply to message/i)).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText(message.text)).toBeInTheDocument());
    };

    const quotedMessagePreviewIsNotDisplayed = (message) => {
      expect(screen.queryByText(/reply to message/i)).not.toBeInTheDocument();
      expect(screen.queryByText(message.text)).not.toBeInTheDocument();
    };

    describe('QuotedMessagePreview', () => {
      it('is displayed on quote action click', async () => {
        const message = await render();
        await initQuotedMessagePreview(message);
        await quotedMessagePreviewIsDisplayedCorrectly(message);
      });

      it('is updated on original message update', async () => {
        const message = await render();
        await initQuotedMessagePreview(message);
        message.text = nanoid();
        act(() => {
          dispatchMessageUpdatedEvent(chatClient, message, channel);
        });
        await quotedMessagePreviewIsDisplayedCorrectly(message);
      });

      it('is closed on close button click', async () => {
        const message = await render();
        await initQuotedMessagePreview(message);
        const closeBtn = screen.getByRole('button', { name: /cancel reply/i });
        act(() => {
          fireEvent.click(closeBtn);
        });
        quotedMessagePreviewIsNotDisplayed(message);
      });

      it('is closed on original message delete', async () => {
        const message = await render();
        await initQuotedMessagePreview(message);
        act(() => {
          dispatchMessageDeletedEvent(chatClient, message, channel);
        });
        quotedMessagePreviewIsNotDisplayed(message);
      });
    });
  });
});
