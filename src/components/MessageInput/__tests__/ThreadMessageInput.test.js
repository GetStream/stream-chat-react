import '@testing-library/jest-dom';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatProvider, MessageProvider, useChannelActionContext } from '../../../context';
import { Channel } from '../../Channel';
import { MessageActionsBox } from '../../MessageActions';
import React, { useEffect, useRef } from 'react';
import { SearchController } from 'stream-chat';
import { MessageInput } from '../MessageInput';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';

const sendMessageMock = jest.fn();
const fileUploadUrl = 'http://www.getstream.io';
const cid = 'messaging:general';
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

const defaultMessageContextValue = {
  getMessageActions: () => ['delete', 'edit', 'quote'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  isMyMessage: () => true,
  message: mainListMessage,
};

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
  const getDraftSpy = jest
    .spyOn(customChannel, 'getDraft')
    .mockResolvedValue({ draft: { message: { id: 'x' } } });
  customChannel.initialized = true;
  customClient.activeChannels[customChannel.cid] = customChannel;
  return { customChannel, customClient, getDraftSpy, sendFileSpy, sendImageSpy };
};

const ThreadSetter = () => {
  const { openThread } = useChannelActionContext();
  const isOpenThread = useRef(false);
  useEffect(() => {
    if (isOpenThread.current) return;
    isOpenThread.current = true;
    openThread(mainListMessage);
  }, [openThread]);
};

const renderComponent = async ({
  channelData = {},
  channelProps = {},
  chatContextOverrides = {},
  customChannel,
  customClient,
  customUser,
  messageActionsBoxProps = {},
  messageContextOverrides = {},
  messageInputProps = {},
  thread,
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
        <Channel doSendMessageRequest={sendMessageMock} {...channelProps}>
          <ThreadSetter />
          <MessageProvider
            value={{ ...defaultMessageContextValue, ...messageContextOverrides }}
          >
            <MessageActionsBox
              {...messageActionsBoxProps}
              getMessageActions={defaultMessageContextValue.getMessageActions}
            />
          </MessageProvider>
          <LegacyThreadContext.Provider
            value={{ legacyThread: thread ?? mainListMessage }}
          >
            <MessageInput
              isThreadInput
              parent={thread ?? mainListMessage}
              {...messageInputProps}
            />
          </LegacyThreadContext.Provider>
        </Channel>
      </ChatProvider>,
    );
  });

  const submit = async () => {
    const submitButton =
      renderResult.findByText('Send') || renderResult.findByTitle('Send');
    fireEvent.click(await submitButton);
  };

  return { channel, client, submit, ...renderResult };
};

describe('MessageInput in Thread', () => {
  describe('draft', () => {
    it('is queried when drafts are enabled', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: true } });
        });
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(getDraftSpy).toHaveBeenCalledTimes(1);
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: false } });
        });
      });
    });
    it('prevents querying if composition is not empty', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: true } });
          composer.textComposer.setText('abc');
        });
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(getDraftSpy).not.toHaveBeenCalled();
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: false } });
        });
      });
    });
    it('prevents querying if not rendered inside a thread', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: true } });
          composer.compositionContext = customChannel;
        });
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(getDraftSpy).not.toHaveBeenCalled();
      await act(() => {
        customClient.setMessageComposerSetupFunction(({ composer }) => {
          composer.updateConfig({ drafts: { enabled: false } });
        });
      });
    });
    it('prevents querying if drafts are disabled (default)', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(getDraftSpy).not.toHaveBeenCalled();
    });
  });

  it('renders in the thread context for direct messaging channel', async () => {
    const { customChannel, customClient } = await setup();
    await renderComponent({
      customChannel,
      customClient,
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Also send as a direct message')).toBeInTheDocument();
    });
  });
  it('renders in the thread context for non-direct messaging channel', async () => {
    const mainListMessage = generateMessage({ cid, user });
    const threadMessage = generateMessage({
      parent_id: mainListMessage.id,
      type: 'reply',
      user,
    });

    const channelData = generateChannel({
      channel: {
        id: 'general',
        own_capabilities: ['send-poll', 'upload-file'],
        type: 'messaging',
      },
      members: [
        generateMember({ user }),
        generateMember({ user: mentionUser }),
        generateMember({ user: generateUser() }),
      ],
      // new parent message id has to be provided otherwise the cachedParentMessage in useMessageComposer
      // will retrieve the composer from the previous test
      messages: [{ ...mainListMessage, id: 'x' }],
      thread: [{ ...threadMessage, parent_id: 'x' }],
    });
    const { customChannel, customClient } = await setup({ channelData });
    await renderComponent({
      customChannel,
      customClient,
      thread: channelData.messages[0],
    });
    expect(screen.getByLabelText('Also send in channel')).toBeInTheDocument();
  });
});
