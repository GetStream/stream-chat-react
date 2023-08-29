import { MessageInputFlat } from '../MessageInputFlat';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateScrapedAudioAttachment,
  generateScrapedDataAttachment,
  generateScrapedImageAttachment,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ChatProvider,
  MessageProvider,
  useChatContext,
  useMessageInputContext,
} from '../../../context';
import React, { useEffect } from 'react';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { MessageActionsBox } from '../../MessageActions';
import { MessageInput } from '../MessageInput';

import '@testing-library/jest-dom';
import { SendButton } from '../icons';

jest.useFakeTimers('modern');

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

let chatClient;
let channel;

const initQuotedMessagePreview = async (message) => {
  await waitFor(() => expect(screen.queryByText(message.text)).not.toBeInTheDocument());

  const quoteButton = await screen.findByText(/^reply$/i);
  await waitFor(() => expect(quoteButton).toBeInTheDocument());

  act(() => {
    fireEvent.click(quoteButton);
  });
};

const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useChatContext();
  useEffect(() => {
    setActiveChannel(activeChannel);
  }, [activeChannel]);
  return null;
};

const ChatContextOverrider = ({ children, contextOverrides }) => {
  const context = useChatContext();
  return <ChatProvider value={{ ...context, ...contextOverrides }}>{children}</ChatProvider>;
};

const makeRenderFn = (InputComponent) => async ({
  messageInputProps = {},
  channelProps = {},
  chatContextOverrides = {},
  client = chatClient,
  messageContextOverrides = {},
  messageActionsBoxProps = {},
} = {}) => {
  // circumvents not so good decision to render SendButton conditionally
  const InputContainer = () => {
    const { handleSubmit, message } = useMessageInputContext();
    return (
      <>
        <InputComponent />
        {!!message && <SendButton sendMessage={handleSubmit} />}
      </>
    );
  };

  let renderResult;
  await act(() => {
    renderResult = render(
      <Chat client={client}>
        <ChatContextOverrider contextOverrides={chatContextOverrides}>
          <ActiveChannelSetter activeChannel={channel} />
          <Channel {...channelProps}>
            <MessageProvider value={{ ...defaultMessageContextValue, ...messageContextOverrides }}>
              <MessageActionsBox
                {...messageActionsBoxProps}
                getMessageActions={defaultMessageContextValue.getMessageActions}
              />
            </MessageProvider>
            <MessageInput Input={InputContainer} {...messageInputProps} />
          </Channel>
        </ChatContextOverrider>
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

describe('Link preview', () => {
  const LINK_PREVIEW_TEST_ID = 'link-preview-card';
  const LINK_PREVIEW_DISMISS_BTN_TEST_ID = 'link-preview-card-dismiss-btn';
  const CHAT_CONTEXT_OVERRIDES_COMMON = { themeVersion: '2' };
  const MESSAGE_INPUT_PROPS_COMMON = {
    urlEnrichmentConfig: { enrichURLForPreview: true },
  };
  const renderComponent = makeRenderFn(MessageInputFlat);
  const scrapedData = generateScrapedDataAttachment({ og_scrape_url: 'http://getstream.io' });
  const scrapedData1 = generateScrapedDataAttachment({ og_scrape_url: 'http://getstream.io' });
  const scrapedData2 = generateScrapedDataAttachment({ og_scrape_url: 'http://getstream.io/' });
  const scrapedData3 = generateScrapedDataAttachment({
    og_scrape_url: 'http://getstream.io/abc',
  });

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: user1.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });

  afterEach(tearDown);
  it.todo('does not render if link previews are disabled');
  it('does not render if no text', async () => {
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });
    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: '',
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviews).not.toBeInTheDocument();
  });

  it('does not render if not URLs found', async () => {
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });
    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: 'X',
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviews).not.toBeInTheDocument();
  });

  it('does not render queued or loading links', async () => {
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });
    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: 'X https://getstream.io',
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviews).not.toBeInTheDocument();
  });

  it('does not render failed-to-fetch links', async () => {
    jest.spyOn(chatClient, 'enrichURL').mockRejectedValueOnce(new Error());
    await renderComponent({
      chatContextOverrides: { ...CHAT_CONTEXT_OVERRIDES_COMMON },
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: 'X https://getstream.io',
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviews).not.toBeInTheDocument();
  });

  it('renders for URL with protocol', async () => {
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    await waitFor(() => {
      expect(linkPreviews).toBeInTheDocument();
    });
  });

  it('renders for URL without protocol', async () => {
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData.og_scrape_url);
  });

  it('does not render with quoted message', async () => {
    const { message } = defaultMessageContextValue;
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageContextOverrides: { message },
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });
    await initQuotedMessagePreview(message);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    const linkPreview = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreview).not.toBeInTheDocument();
  });

  it('does not request URL enrichment if disabled in channel config', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const {
      channel: { config },
    } = generateChannel({ config: { url_enrichment: false } });
    channel.getConfig = () => config;
    const enrichSpy = jest.spyOn(chatClient, 'enrichURL');
    await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(enrichSpy).not.toHaveBeenCalled();
  });

  it('renders for all the URLs', async () => {
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData2 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData3 });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    let linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData1.og_scrape_url);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(2);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData1.og_scrape_url);
    expect(linkPreviews[1]).toHaveTextContent(scrapedData2.og_scrape_url);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url} ${scrapedData3.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(3);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData1.og_scrape_url);
    expect(linkPreviews[1]).toHaveTextContent(scrapedData2.og_scrape_url);
    expect(linkPreviews[2]).toHaveTextContent(scrapedData3.og_scrape_url);
  });

  it('renders for all the pasted URLs', async () => {
    const pastedText = `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url} ${scrapedData3.og_scrape_url}`;
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData2 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData3 });

    const pastedItem = {
      getAsString: (cb) => cb(pastedText),
      kind: 'string',
    };
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.paste(await screen.findByPlaceholderText(inputPlaceholder), {
        clipboardData: {
          items: [
            {
              ...pastedItem,
              type: 'text/plain',
            },
            {
              ...pastedItem,
              type: 'text/html',
            },
          ],
        },
      });
    });

    jest.runOnlyPendingTimers();

    await waitFor(() => {
      const linkPreviews = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
      // eslint-disable-next-line
      expect(linkPreviews).toHaveLength(3);
      expect(linkPreviews[0]).toHaveTextContent(scrapedData1.og_scrape_url);
      expect(linkPreviews[1]).toHaveTextContent(scrapedData2.og_scrape_url);
      expect(linkPreviews[2]).toHaveTextContent(scrapedData3.og_scrape_url);
    });
  });

  it('renders as single preview if duplicates are present', async () => {
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    let linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData.og_scrape_url);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url} ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData.og_scrape_url);
  });

  it('prevent duplicate URL enrichment for URLs, where enrichment has not failed', async () => {
    const enrichSpy = jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValue({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(enrichSpy).toHaveBeenCalledWith(scrapedData.og_scrape_url);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url} ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(enrichSpy).toHaveBeenCalledTimes(1);
  });

  it('request enrichment for duplicate URLs where enrichment previously failed', async () => {
    const enrichSpy = jest.spyOn(chatClient, 'enrichURL').mockRejectedValueOnce(new Error());
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(enrichSpy).toHaveBeenCalledWith(scrapedData.og_scrape_url);
    expect(enrichSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url} ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(enrichSpy).toHaveBeenCalledWith(scrapedData.og_scrape_url);
    expect(enrichSpy).toHaveBeenCalledTimes(2);
  });

  it('is unmounted when the URL is removed from the textarea value', async () => {
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    let linkPreviews = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData.og_scrape_url);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData.og_scrape_url.slice(0, -1)}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    linkPreviews = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(0);
  });

  it('is unmounted and disabled when dismissed', async () => {
    const typedText = `X ${scrapedData.og_scrape_url}`;
    jest.spyOn(chatClient, 'enrichURL').mockResolvedValueOnce({ duration: '10ms', ...scrapedData });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: typedText,
        },
      });
      jest.runOnlyPendingTimers();
    });
    let linkPreviews = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData.og_scrape_url);

    await act(async () => {
      fireEvent.click(await screen.findByTestId(LINK_PREVIEW_DISMISS_BTN_TEST_ID));
    });
    linkPreviews = screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(0);

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: typedText,
        },
      });
      jest.runOnlyPendingTimers();
    });

    expect(screen.queryByTestId(LINK_PREVIEW_TEST_ID)).not.toBeInTheDocument();
  });

  it('are sent as attachments to posted message with skip_enrich_url:true', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();

    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData2 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData3 });
    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url} ${scrapedData3.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });
    await act(() => submit());

    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining(scrapedData1),
          expect.objectContaining(scrapedData2),
          expect.objectContaining(scrapedData3),
        ]),
      }),
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  it('are not sent as attachments to posted message with skip_enrich_url:true if dismissed', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();

    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData2 });
    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      const dismissButtons = await screen.findAllByTestId(LINK_PREVIEW_DISMISS_BTN_TEST_ID);
      fireEvent.click(dismissButtons[1]);
    });

    await act(() => submit());
    expect(sendMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedData1)]),
      }),
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  // todo: find out how to manipulate the link previews to keep them in non-loaded state on submit
  it.todo(
    'does not submit link preview attachments unless all the previews are in loaded or failed state',
    // async () => {
    //   // const channel = chatClient.channel('messaging', mockedChannel.id);
    //   const sendMessageSpy = jest.spyOn(chatClient, 'updateMessage').mockImplementation();
    //   const existingMessage = generateMessage({
    //     attachments: [
    //       {
    //         ...generateScrapedImageAttachment({ og_scrape_url: 'loading-image-attachment' }),
    //         state: LinkPreviewState.LOADING,
    //       },
    //       {
    //         ...generateScrapedImageAttachment({ og_scrape_url: 'queued-image-attachment' }),
    //         state: LinkPreviewState.QUEUED,
    //       },
    //     ],
    //   });
    //   jest
    //     .spyOn(chatClient, 'enrichURL')
    //     .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    //
    //   const { submit } = await renderComponent({
    //     // channelProps: { channel },
    //     chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
    //     messageInputProps: {
    //       ...MESSAGE_INPUT_PROPS_COMMON,
    //       message: existingMessage,
    //       urlEnrichmentConfig: { findURLFn: jest.fn },
    //     },
    //   });
    //
    //   await act(async () => {
    //     fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
    //       target: {
    //         value: `X ${scrapedData1.og_scrape_url}`,
    //       },
    //     });
    //   });
    //   jest.runOnlyPendingTimers();
    //
    //   await act(() => submit());
    //
    //   expect(sendMessageSpy.mock.calls[0][0].attachments).toBe('X');
    // },
  );

  it('does not add failed link previews among attachments', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();

    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest.spyOn(chatClient, 'enrichURL').mockRejectedValueOnce();
    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(sendMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedData1)]),
      }),
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  it('does not add dismissed link previews among attachments', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData2 });
    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData2.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      const dismissButtons = await screen.findAllByTestId(LINK_PREVIEW_DISMISS_BTN_TEST_ID);
      fireEvent.click(dismissButtons[1]);
    });

    await act(() => submit());

    expect(sendMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedData1)]),
      }),
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  it('does not render duplicate link previews', async () => {
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} X ${scrapedData1.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    const linkPreviews = await screen.queryAllByTestId(LINK_PREVIEW_TEST_ID);
    // eslint-disable-next-line
    expect(linkPreviews).toHaveLength(1);
    expect(linkPreviews[0]).toHaveTextContent(scrapedData1.og_scrape_url);
  });

  it('are sent as attachments to posted message with skip_enrich_url:true on message update', async () => {
    const editMessageSpy = jest.spyOn(chatClient, 'updateMessage').mockImplementation();
    const existingMessage = generateMessage({ attachments: [scrapedData1] });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });

    const { submit } = await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: {
        ...MESSAGE_INPUT_PROPS_COMMON,
        message: existingMessage,
      },
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url} Y`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(editMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(editMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedData1)]),
      }),
      undefined,
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  it('are sent with updated attachments on message update', async () => {
    const editMessageSpy = jest.spyOn(chatClient, 'updateMessage').mockImplementation();
    const scrapedAudioAttachment = generateScrapedAudioAttachment({
      og_scrape_url: 'http://getstream.io/audio',
    });
    const scrapedImageAttachment = generateScrapedImageAttachment({
      og_scrape_url: 'http://getstream.io/image',
    });
    const existingMessage = generateMessage({ attachments: [scrapedAudioAttachment] });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedImageAttachment });

    const { submit } = await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: {
        ...MESSAGE_INPUT_PROPS_COMMON,
        message: existingMessage,
      },
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedImageAttachment.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(editMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(editMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedImageAttachment)]),
      }),
      undefined,
      expect.objectContaining({ skip_enrich_url: true }),
    );
  });

  it('should not submit updated scraped data when enrichment in preview is disabled', async () => {
    const editMessageSpy = jest.spyOn(chatClient, 'updateMessage').mockImplementation();
    const scrapedAudioAttachment = generateScrapedAudioAttachment({
      og_scrape_url: 'http://getstream.io/audio',
    });
    const scrapedImageAttachment = generateScrapedImageAttachment({
      og_scrape_url: 'http://getstream.io/image',
    });
    const existingMessage = generateMessage({ attachments: [scrapedAudioAttachment] });
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedImageAttachment });

    const { submit } = await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: {
        message: existingMessage,
      },
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedImageAttachment.og_scrape_url}`,
        },
      });
      jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(editMessageSpy.mock.calls[0][0].attachments).toHaveLength(1);
    expect(editMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([expect.objectContaining(scrapedAudioAttachment)]),
      }),
      undefined,
      undefined,
    );
  });

  it('submit new message with skip_url_enrich:false if no link previews managed to get loaded', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();

    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });

    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });

      // not waiting for debounced url search to finish
      // jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(sendMessageSpy.mock.calls[0][0].attachments).toHaveLength(0);
    expect(sendMessageSpy.mock.calls[0][1].skip_enrich_url).toBe(false);
  });

  it('submit updated message with skip_url_enrich:false if no link previews managed to get loaded', async () => {
    const channel = chatClient.channel('messaging', mockedChannel.id);
    const scrapedAudioAttachment = generateScrapedAudioAttachment({
      og_scrape_url: 'http://getstream.io/audio',
    });
    const scrapedImageAttachment = generateScrapedImageAttachment({
      og_scrape_url: 'http://getstream.io/image',
    });
    const existingMessage = generateMessage({ attachments: [scrapedAudioAttachment] });

    const sendMessageSpy = jest.spyOn(channel, 'sendMessage').mockImplementation();
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedImageAttachment });

    const { submit } = await renderComponent({
      channelProps: { channel },
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: {
        ...MESSAGE_INPUT_PROPS_COMMON,
        existingMessage,
      },
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedImageAttachment.og_scrape_url}`,
        },
      });

      // not waiting for debounced url search to finish
      // jest.runOnlyPendingTimers();
    });

    await act(() => submit());

    expect(sendMessageSpy.mock.calls[0][0].attachments).toHaveLength(0);
    expect(sendMessageSpy.mock.calls[0][1].skip_enrich_url).toBe(false);
  });

  it('should not be shown after submit if the URL enrichment has not finished', async () => {
    jest
      .spyOn(chatClient, 'enrichURL')
      .mockResolvedValueOnce({ duration: '10ms', ...scrapedData1 });
    const { submit } = await renderComponent({
      chatContextOverrides: CHAT_CONTEXT_OVERRIDES_COMMON,
      messageInputProps: MESSAGE_INPUT_PROPS_COMMON,
    });

    await act(async () => {
      fireEvent.change(await screen.findByPlaceholderText(inputPlaceholder), {
        target: {
          value: `X ${scrapedData1.og_scrape_url}`,
        },
      });
    });

    await act(() => submit());
    const linkPreviews = await screen.queryByTestId(LINK_PREVIEW_TEST_ID);
    expect(linkPreviews).not.toBeInTheDocument();
  });
  it.todo('are retrieved with custom search function');
  it.todo('enables custom handling of dismissal');
  it.todo('enables custom debounce interval for typing');
  it.todo('enables custom debounce interval for pasting');
  it.todo('enrich only urls with protocol?');
});
