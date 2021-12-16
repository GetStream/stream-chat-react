import React, { useEffect } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

import { MessageInput } from '../MessageInput';
import { MessageInputFlat } from '../MessageInputFlat';
import { MessageInputSmall } from '../MessageInputSmall';
import { EditMessageForm } from '../EditMessageForm';

import { Chat } from '../../Chat/Chat';
import { Channel } from '../../Channel/Channel';

import { useChatContext } from '../../../context/ChatContext';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

let chatClient;
let channel;

const submitMock = jest.fn();
const editMock = jest.fn();

const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useChatContext();
  useEffect(() => {
    setActiveChannel(activeChannel);
  });
  return null;
};

[
  { InputComponent: MessageInputSmall, name: 'MessageInputSmall' },
  { InputComponent: MessageInputFlat, name: 'MessageInputFlat' },
  { InputComponent: EditMessageForm, name: 'EditMessageForm' },
].forEach(({ InputComponent, name: componentName }) => {
  const renderComponent = (props = {}, channelProps = {}) => {
    const renderResult = render(
      <Chat client={chatClient}>
        <ActiveChannelSetter activeChannel={channel} />
        <Channel
          doSendMessageRequest={submitMock}
          doUpdateMessageRequest={editMock}
          {...channelProps}
        >
          <MessageInput Input={InputComponent} {...props} />
        </Channel>
      </Chat>,
    );

    const submit = async () => {
      const submitButton = renderResult.findByText('Send') || renderResult.findByTitle('Send');
      fireEvent.click(await submitButton);
    };

    return { submit, ...renderResult };
  };

  describe(`${componentName}`, () => {
    const inputPlaceholder = 'Type your message';
    const userId = 'userId';
    const username = 'username';
    const mentionId = 'mention-id';
    const mentionName = 'mention-name';

    // First, set up a client and channel, so we can properly set up the context etc.
    beforeAll(async () => {
      const user1 = generateUser({ id: userId, name: username });
      const mentionUser = generateUser({
        id: mentionId,
        name: mentionName,
      });
      const message1 = generateMessage({ user: user1 });
      const mockedChannel = generateChannel({
        members: [generateMember({ user: user1 }), generateMember({ user: mentionUser })],
        messages: [message1],
      });
      chatClient = await getTestClientWithUser({ id: user1.id });
      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      channel = chatClient.channel('messaging', mockedChannel.id);
    });

    afterEach(() => {
      cleanup();
      jest.clearAllMocks();
    });

    function dropFile(file, formElement) {
      fireEvent.drop(formElement, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      });
    }

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

    const mockFaultyUploadApi = (cause) =>
      jest.fn().mockImplementation(() => Promise.reject(cause));

    it('Should shift focus to the textarea if the `focus` prop is true', async () => {
      const { container, getByPlaceholderText } = renderComponent({
        focus: true,
      });
      await waitFor(() => {
        expect(getByPlaceholderText(inputPlaceholder)).toHaveFocus();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should render default emoji svg', async () => {
      const { container, findByTitle } = renderComponent();
      const emojiIcon = await findByTitle('Open emoji picker');

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

      const { container, findByTitle } = renderComponent({}, { EmojiIcon });

      const emojiIcon = await findByTitle('NotEmoji');

      await waitFor(() => {
        expect(emojiIcon).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should render default file upload icon', async () => {
      const { container, findByTitle } = renderComponent();
      const fileUploadIcon = await findByTitle('Attach files');

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

      const { container, findByTitle } = renderComponent({}, { FileUploadIcon });

      const fileUploadIcon = await findByTitle('NotFileUploadIcon');

      await waitFor(() => {
        expect(fileUploadIcon).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Should open the emoji picker after clicking the icon, and allow adding emojis to the message', async () => {
      const { container, findByTitle, getByDisplayValue, queryAllByText } = renderComponent();

      const emojiIcon = await findByTitle('Open emoji picker');
      fireEvent.click(emojiIcon);

      await waitFor(() => {
        expect(container.querySelector('.emoji-mart')).toBeInTheDocument();
      });

      const emoji = '💯';
      const emojiButton = queryAllByText(emoji)[0];
      expect(emojiButton).toBeInTheDocument();

      fireEvent.click(emojiButton);

      // expect input to have emoji as value
      expect(getByDisplayValue(emoji)).toBeInTheDocument();

      // close picker
      fireEvent.click(container);
      expect(container.querySelector('.emoji-mart')).not.toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    describe('Attachments', () => {
      it('Pasting images and files should result in uploading the files and showing previewers', async () => {
        const doImageUploadRequest = mockUploadApi();
        const doFileUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText, findByText } = renderComponent({
          doFileUploadRequest,
          doImageUploadRequest,
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
        const formElement = await findByPlaceholderText(inputPlaceholder);
        formElement.dispatchEvent(clipboardEvent);
        const filenameText = await findByText(filename);
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
        const { container, findByPlaceholderText } = renderComponent({
          doImageUploadRequest,
        });
        // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        dropFile(file, formElement);

        await waitFor(() => {
          expect(doImageUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should upload, display and link to a file when it is dropped on the dropzone', async () => {
        const { container, findByPlaceholderText, findByText } = renderComponent({
          doFileUploadRequest: mockUploadApi(),
        });
        // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
        const formElement = await findByPlaceholderText(inputPlaceholder);
        dropFile(getFile(), formElement);

        const filenameText = await findByText(filename);

        expect(filenameText).toBeInTheDocument();
        expect(filenameText.closest('a')).toHaveAttribute('href', fileUploadUrl);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should allow uploading files with the file upload button', async () => {
        const { container, findByTestId, findByText } = renderComponent({
          doFileUploadRequest: mockUploadApi(),
        });
        const file = getFile();
        const input = (await findByTestId('fileinput')).querySelector('input');

        fireEvent.change(input, {
          target: {
            files: [file],
          },
        });

        const filenameText = await findByText(filename);

        expect(filenameText).toBeInTheDocument();
        expect(filenameText.closest('a')).toHaveAttribute('href', fileUploadUrl);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should call error handler if an image failed to upload', async () => {
        const cause = new Error('failed to upload');
        const doImageUploadRequest = mockFaultyUploadApi(cause);
        const errorHandler = jest.fn();
        const { container, findByPlaceholderText } = renderComponent({
          doImageUploadRequest,
          errorHandler,
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        dropFile(file, formElement);

        await waitFor(() => {
          expect(errorHandler).toHaveBeenCalledWith(cause, 'upload-image', expect.any(Object));
          expect(doImageUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should call error handler if a file failed to upload and allow retrying', async () => {
        const cause = new Error('failed to upload');
        const doFileUploadRequest = mockFaultyUploadApi(cause);
        const errorHandler = jest.fn();

        const { container, findByPlaceholderText, findByText } = renderComponent({
          doFileUploadRequest,
          errorHandler,
        });
        jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getFile();
        dropFile(file, formElement);

        await waitFor(() => {
          expect(errorHandler).toHaveBeenCalledWith(cause, 'upload-file', expect.any(Object));
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object));
        });

        doFileUploadRequest.mockImplementationOnce(() => Promise.resolve({ file }));

        fireEvent.click(await findByText('retry'));

        await waitFor(() =>
          expect(doFileUploadRequest).toHaveBeenCalledWith(file, expect.any(Object)),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should not set multiple attribute on the file input if multipleUploads is false', async () => {
        const { container, findByTestId } = renderComponent(
          {},
          {
            multipleUploads: false,
          },
        );
        const input = (await findByTestId('fileinput')).querySelector('input');
        expect(input).not.toHaveAttribute('multiple');
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should set multiple attribute on the file input if multipleUploads is true', async () => {
        const { container, findByTestId } = renderComponent(
          {},
          {
            multipleUploads: true,
          },
        );
        const input = (await findByTestId('fileinput')).querySelector('input');
        expect(input).toHaveAttribute('multiple');
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      const filename1 = '1.txt';
      const filename2 = '2.txt';
      it('should only allow dropping maxNumberOfFiles files into the dropzone', async () => {
        const { container, findByPlaceholderText, queryByText } = renderComponent(
          {
            doFileUploadRequest: mockUploadApi(),
          },
          {
            maxNumberOfFiles: 1,
          },
        );

        const formElement = await findByPlaceholderText(inputPlaceholder);

        const file = getFile(filename1);
        dropFile(file, formElement);
        await waitFor(() => expect(queryByText(filename1)).toBeInTheDocument());

        const file2 = getFile(filename2);
        act(() => dropFile(file2, formElement));
        await waitFor(() => expect(queryByText(filename2)).not.toBeInTheDocument());
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should only allow uploading 1 file if multipleUploads is false', async () => {
        const { container, findByPlaceholderText, queryByText } = renderComponent(
          {
            doFileUploadRequest: mockUploadApi(),
          },
          {
            multipleUploads: false,
          },
        );

        const formElement = await findByPlaceholderText(inputPlaceholder);

        const file = getFile(filename1);
        dropFile(file, formElement);
        await waitFor(() => expect(queryByText(filename1)).toBeInTheDocument());

        const file2 = getFile(filename2);
        act(() => dropFile(file2, formElement));
        await waitFor(() => expect(queryByText(filename2)).not.toBeInTheDocument());
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      // TODO: Check if pasting plaintext is not prevented -> tricky because recreating exact event is hard
      // TODO: Remove image/file -> difficult because there is no easy selector and components are in react-file-utils
    });

    describe('Uploads disabled in Channel config', () => {
      let originalConfig;
      beforeAll(() => {
        originalConfig = channel.getConfig;
        channel.getConfig = () => ({ uploads: false });
      });
      afterAll(() => {
        channel.getConfig = originalConfig;
      });

      it('should not render file upload button', async () => {
        const { container, queryByTestId } = renderComponent();
        expect(queryByTestId('fileinput')).not.toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Pasting images and files should do nothing', async () => {
        const doImageUploadRequest = mockUploadApi();
        const doFileUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText, queryByText } = renderComponent({
          doFileUploadRequest,
          doImageUploadRequest,
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
        const formElement = await findByPlaceholderText(inputPlaceholder);
        formElement.dispatchEvent(clipboardEvent);
        await waitFor(() => {
          expect(queryByText(filename)).not.toBeInTheDocument();
          expect(doFileUploadRequest).not.toHaveBeenCalled();
          expect(doImageUploadRequest).not.toHaveBeenCalled();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should not upload an image when it is dropped on the dropzone', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText } = renderComponent({
          doImageUploadRequest,
        });
        // drop on the form input. Technically could be dropped just outside of it as well, but the input should always work.
        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        dropFile(file, formElement);

        await waitFor(() => {
          expect(doImageUploadRequest).not.toHaveBeenCalled();
        });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Submitting', () => {
      it('Should submit the input value when clicking the submit button', async () => {
        const { container, findByPlaceholderText, submit } = renderComponent();

        const messageText = 'Some text';

        fireEvent.change(await findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });

        await submit();

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            text: messageText,
          }),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should use overrideSubmitHandler prop if it is defined', async () => {
        const overrideMock = jest.fn().mockImplementation(() => Promise.resolve());
        const { container, findByPlaceholderText, submit } = renderComponent({
          overrideSubmitHandler: overrideMock,
        });
        const messageText = 'Some text';

        fireEvent.change(await findByPlaceholderText(inputPlaceholder), {
          target: {
            value: messageText,
          },
        });
        await submit();

        expect(overrideMock).toHaveBeenCalledWith(
          expect.objectContaining({
            text: messageText,
          }),
          channel.cid,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('Should not do anything if the message is empty and has no files', async () => {
        const { container, submit } = renderComponent();

        await submit();

        expect(submitMock).not.toHaveBeenCalled();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should add image as attachment if a message is submitted with an image', async () => {
        const doImageUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText, submit } = renderComponent({
          doImageUploadRequest,
        });

        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getImage();
        dropFile(file, formElement);

        // wait for image uploading to complete before trying to send the message
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doImageUploadRequest).toHaveBeenCalled());
        await submit();
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
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should add file as attachment if a message is submitted with an file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText, submit } = renderComponent({
          doFileUploadRequest,
        });

        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = getFile();
        dropFile(file, formElement);

        // wait for file uploading to complete before trying to send the message
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());
        await submit();
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
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should add audio as attachment if a message is submitted with an audio file', async () => {
        const doFileUploadRequest = mockUploadApi();
        const { container, findByPlaceholderText, submit } = renderComponent({
          doFileUploadRequest,
        });

        const formElement = await findByPlaceholderText(inputPlaceholder);
        const file = new File(['Message in a bottle'], 'the-police.mp3', {
          type: 'audio/mp3',
        });
        dropFile(file, formElement);

        // wait for file uploading to complete before trying to send the message
        // eslint-disable-next-line jest/prefer-called-with
        await waitFor(() => expect(doFileUploadRequest).toHaveBeenCalled());
        await submit();
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
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should not submit if keycodeSubmitKeys are provided and keydown events do not match', async () => {
        const { container, findByPlaceholderText } = renderComponent({
          keycodeSubmitKeys: [[17]],
        });
        const input = await findByPlaceholderText(inputPlaceholder);

        fireEvent.keyDown(input, {
          keyCode: 19,
        });

        expect(submitMock).not.toHaveBeenCalled();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should submit if keycodeSubmitKeys are provided and keydown events do match', async () => {
        const { container, findByPlaceholderText, submit } = renderComponent({
          keycodeSubmitKeys: [[17, 13]],
        });
        const messageText = 'Submission text.';
        const input = await findByPlaceholderText(inputPlaceholder);

        fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });

        fireEvent.keyDown(input, {
          keyCode: 17,
        });

        fireEvent.keyDown(input, {
          keyCode: 13,
        });

        await submit();

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            text: messageText,
          }),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should submit if [[16,13], [57], [48]] are provided as keycodeSubmitKeys and keydown events match 57', async () => {
        const { container, findByPlaceholderText, submit } = renderComponent({
          keycodeSubmitKeys: [[16, 13], [57], [48]],
        });
        const messageText = 'Submission text.';
        const input = await findByPlaceholderText(inputPlaceholder);

        fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });

        fireEvent.keyDown(input, {
          keyCode: 57,
        });

        await submit();

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            text: messageText,
          }),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should submit if just a tuple is provided and keycode events do match', async () => {
        const { container, findByPlaceholderText, submit } = renderComponent({
          keycodeSubmitKeys: [[76, 77]],
        });
        const messageText = 'Submission text.';
        const input = await findByPlaceholderText(inputPlaceholder);

        fireEvent.change(input, {
          target: {
            value: messageText,
          },
        });

        fireEvent.keyDown(input, {
          keyCode: 76,
        });

        fireEvent.keyDown(input, {
          keyCode: 77,
        });

        await submit();

        expect(submitMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({ text: messageText }),
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
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
      const { container, submit } = renderComponent({
        clearEditingState: () => {},
        message,
      });
      await submit();

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
      const { container, findByPlaceholderText, getByTestId, submit } = renderComponent();

      const formElement = await findByPlaceholderText(inputPlaceholder);
      fireEvent.change(formElement, {
        target: {
          selectionEnd: 1,
          value: '@',
        },
      });
      const usernameListItem = await getByTestId('user-item-name');
      expect(usernameListItem).toBeInTheDocument();

      fireEvent.click(usernameListItem);
      await submit();

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
      const { container, findByPlaceholderText, submit } = renderComponent({
        message: {
          mentioned_users: [{ id: userId, name: username }],
          text: `@${username}`,
        },
      });
      // remove all text from input
      const formElement = await findByPlaceholderText(inputPlaceholder);
      fireEvent.change(formElement, {
        target: {
          selectionEnd: 1,
          value: 'no mentioned users',
        },
      });

      await submit();

      await waitFor(() =>
        expect(editMock).toHaveBeenCalledWith(
          channel.cid,
          expect.objectContaining({
            mentioned_users: [],
          }),
        ),
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should override the default List component when SuggestionList is provided as a prop', async () => {
      const AutocompleteSuggestionList = () => (
        <div data-testid='suggestion-list'>Suggestion List</div>
      );

      const { container, findByPlaceholderText, getByTestId, queryByText } = renderComponent(
        {},
        { AutocompleteSuggestionList },
      );

      const formElement = await findByPlaceholderText(inputPlaceholder);

      await waitFor(() => expect(queryByText('Suggestion List')).not.toBeInTheDocument());

      fireEvent.change(formElement, {
        target: { value: '/' },
      });

      if (componentName !== 'EditMessageForm') {
        await waitFor(
          () => expect(getByTestId('suggestion-list')).toBeInTheDocument(), // eslint-disable-line
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
