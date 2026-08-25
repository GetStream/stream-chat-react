// Import the package barrel first so it evaluates in its natural order (components
// then context). MessageComposer's send/update hooks import `useChannel` from this
// root barrel; importing a deep component path first would trigger a partial circular
// re-entry that leaves `useChannel` undefined under Vitest.
import '../../..';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { fromPartial } from '@total-typescript/shoehorn';
import type { GenerateChannelOptions } from '../../../mock-builders/generator/channel';
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import React from 'react';
import type { LocalMessage } from 'stream-chat';
import { MessageComposer } from '../MessageComposer';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';

const sendMessageMock = vi.fn();

/**
 * Registers the interception the removed `doSendMessageRequest` prop used to provide.
 *
 * Declarative registration is the replacement for the per-component props: one place, no mount-order
 * arbitration. The adapter below is what the deleted hook did internally — call the spy, and fall back
 * to the real send when it returns nothing, so tests that only assert *that* a send was intercepted keep
 * working without stubbing a whole response.
 */
const registerSendInterceptor = (client, channel) =>
  client.config.set({
    channel: {
      requestHandlers: {
        sendMessageRequest: async (params) => {
          const response = await sendMessageMock(channel, params.message, params.options);
          if (response?.message) return { message: response.message };
          const fallback = await channel.sendMessage({
            message: params.message,
            ...params.options,
          });
          return { message: fallback.message };
        },
      },
    },
  });
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

const mockedChannelData = generateChannel(
  fromPartial<GenerateChannelOptions>({
    channel: {
      id: 'general',
      own_capabilities: ['send-poll', 'upload-file'],
      type: 'messaging',
    },
    members: [generateMember({ user }), generateMember({ user: mentionUser })],
    messages: [mainListMessage],
    threads: [threadMessage],
  }),
);

const setup = async ({ channelData }: any = {}) => {
  const {
    channels: [customChannel],
    client: customClient,
  } = await initClientWithChannels({
    channelsData: [channelData ?? mockedChannelData],
    customUser: user,
  });
  const uploadImageSpy = vi
    .spyOn(customChannel, 'uploadImage')
    .mockResolvedValueOnce(fromPartial({ file: fileUploadUrl }));
  const uploadFileSpy = vi
    .spyOn(customChannel, 'uploadFile')
    .mockResolvedValueOnce(fromPartial({ file: fileUploadUrl }));
  const getDraftSpy = vi
    .spyOn(customChannel, 'getDraft')
    .mockResolvedValue(fromPartial({ draft: { message: { id: 'x', text: '' } } }));
  vi.spyOn(customChannel, 'deleteDraft').mockResolvedValue(fromPartial({}));
  customChannel.initialized = true;
  customClient.activeChannels[customChannel.cid] = customChannel;
  return { customChannel, customClient, getDraftSpy, uploadFileSpy, uploadImageSpy };
};

const renderComponent = async ({
  channelData = {},
  channelProps = {},
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
  registerSendInterceptor(client, channel);

  let renderResult: RenderResult;

  await act(() => {
    renderResult = render(
      <Chat client={client}>
        <Channel channel={channel} {...channelProps}>
          <LegacyThreadContext.Provider
            value={fromPartial<{ legacyThread: LocalMessage | undefined }>({
              legacyThread: thread ?? mainListMessage,
            })}
          >
            <MessageComposer {...messageInputProps} />
          </LegacyThreadContext.Provider>
        </Channel>
      </Chat>,
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
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
          composer.updateConfig({ drafts: { enabled: true } });
        });
      });
      await renderComponent({
        customChannel,
        customClient,
      });
      expect(getDraftSpy).toHaveBeenCalledTimes(1);
      await act(() => {
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
          composer.updateConfig({ drafts: { enabled: false } });
        });
      });
    });
    it('prevents querying if composition is not empty', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await act(() => {
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
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
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
          composer.updateConfig({ drafts: { enabled: false } });
        });
      });
    });
    it('prevents querying if not rendered inside a thread', async () => {
      const { customChannel, customClient, getDraftSpy } = await setup();
      await act(() => {
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
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
        customClient.config.setSetupFunction('messageComposer', ({ composer }) => {
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

    const channelData = generateChannel(
      fromPartial<GenerateChannelOptions>({
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
      }),
    );
    const { customChannel, customClient } = await setup({ channelData });
    await renderComponent({
      customChannel,
      customClient,
      thread: channelData.messages[0],
    });
    expect(screen.getByLabelText('Also send in channel')).toBeInTheDocument();
  });
});
