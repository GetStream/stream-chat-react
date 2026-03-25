import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { fromPartial } from '@total-typescript/shoehorn';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatProvider, useChannelActionContext } from '../../../context';
import { Channel } from '../../Channel';
import React, { useEffect, useRef } from 'react';
import { SearchController } from 'stream-chat';
import { MessageComposer } from '../MessageComposer';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeChatView: 'channels',
      setActiveChatView: vi.fn(),
    })),
  };
});

const sendMessageMock = vi.fn();
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
  threads: [threadMessage],
} as any);

const defaultChatContext = {
  channelsQueryState: { queryInProgress: 'uninitialized' },
  getAppSettings: vi.fn(),
  latestMessageDatesByChannels: {},
  mutes: [],
  searchController: new SearchController(),
};

const setup = async ({ channelData }: any = {}) => {
  const {
    channels: [customChannel],
    client: customClient,
  } = await initClientWithChannels({
    channelsData: [channelData ?? mockedChannelData],
    customUser: user,
  });
  const sendImageSpy = vi
    .spyOn(customChannel, 'sendImage')
    .mockResolvedValueOnce(fromPartial({ file: fileUploadUrl }));
  const sendFileSpy = vi
    .spyOn(customChannel, 'sendFile')
    .mockResolvedValueOnce(fromPartial({ file: fileUploadUrl }));
  const getDraftSpy = vi
    .spyOn(customChannel, 'getDraft')
    .mockResolvedValue(fromPartial({ draft: { message: { id: 'x', text: '' } } }));
  vi.spyOn(customChannel, 'deleteDraft').mockResolvedValue(fromPartial({}));
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
    openThread(mainListMessage as any);
  }, [openThread]);
};

const renderComponent = async ({
  channelData = {},
  channelProps = {},
  chatContextOverrides = {},
  customChannel,
  customClient,
  customUser,
  messageInputProps = {},
  thread,
}: any = {}) => {
  let channel = customChannel;
  let client = customClient;
  if (!(channel || client)) {
    const result = await initClientWithChannels({
      channelsData: [{ ...mockedChannelData, ...channelData }],
      customUser: customUser || user,
    });
    channel = result.channels[0];
    client = result.client;
    vi.spyOn(channel, 'deleteDraft').mockResolvedValue({});
  }
  let renderResult;

  await act(() => {
    renderResult = render(
      <ChatProvider
        value={{ ...defaultChatContext, channel, client, ...chatContextOverrides } as any}
      >
        <Channel doSendMessageRequest={sendMessageMock} {...channelProps}>
          {/* @ts-expect-error -- test-only component */}
          <ThreadSetter />
          <LegacyThreadContext.Provider
            value={{ legacyThread: thread ?? mainListMessage } as any}
          >
            <MessageComposer {...messageInputProps} />
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
          (composer as any).compositionContext = customChannel;
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
      threads: [{ ...threadMessage, parent_id: 'x' }],
    } as any);
    const { customChannel, customClient } = await setup({ channelData });
    await renderComponent({
      customChannel,
      customClient,
      thread: channelData.messages[0],
    });
    expect(screen.getByLabelText('Also send in channel')).toBeInTheDocument();
  });
});
