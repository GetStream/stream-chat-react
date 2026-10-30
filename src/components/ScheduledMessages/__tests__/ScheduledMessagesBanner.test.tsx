import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { formatMessage, ScheduledMessageEventType, SearchController } from 'stream-chat';
import type { LocalMessage, ScheduledMessageResponse } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import { Channel } from '../../Channel';
import { DialogManagerProvider, TranslationProvider } from '../../../context';
import { type ChatContextValue, ChatProvider } from '../../../context/ChatContext';
import { WithComponents } from '../../../context/WithComponents';
import { Streami18n } from '../../../i18n';
import { MessageComposer } from '../../MessageComposer';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';
import {
  dispatchScheduledMessageEvent,
  generateChannel,
  generateMessage,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });

const cid = 'messaging:general';
const parentId = 'parent-1';

const channelDataWith = (ownCapabilities: string[]) =>
  generateChannel({
    channel: { id: 'general', own_capabilities: ownCapabilities, type: 'messaging' },
  });

const threadReply = () =>
  generateScheduledMessage({ cid, message: { parent_id: parentId, text: 'reply' } });

type RenderComposerOptions = {
  canSchedule?: boolean;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  inThread?: boolean;
  scheduledMessages?: ScheduledMessageResponse[];
};

const renderComposer = async ({
  canSchedule = true,
  components = {},
  inThread = false,
  scheduledMessages = [],
}: RenderComposerOptions = {}) => {
  const ownCapabilities = canSchedule
    ? ['send-message', 'schedule-message']
    : ['send-message'];
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [channelDataWith(ownCapabilities)],
    customUser: user,
  });
  scheduledMessages.forEach(client.scheduledMessages.upsertToState);
  client.scheduledMessages.registerSubscriptions();

  const translators = await new Streami18n({ language: 'en' }).getTranslators();
  const legacyThread: LocalMessage | undefined = inThread
    ? formatMessage(generateMessage({ cid, id: parentId }))
    : undefined;

  const ThreadScope = ({ children }: PropsWithChildren) => (
    <LegacyThreadContext.Provider value={{ legacyThread }}>
      {children}
    </LegacyThreadContext.Provider>
  );

  await act(() => {
    render(
      <WithComponents overrides={components}>
        <ChatProvider
          value={fromPartial<ChatContextValue>({
            channel,
            channelsQueryState: { queryInProgress: 'uninitialized' },
            client,
            getAppSettings: vi.fn(),
            latestMessageDatesByChannels: {},
            mutes: [],
            searchController: new SearchController(),
          })}
        >
          <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
            <DialogManagerProvider id='scheduled-messages-banner-test-dialog-manager'>
              <Channel channel={channel}>
                <ThreadScope>
                  <MessageComposer />
                </ThreadScope>
              </Channel>
            </DialogManagerProvider>
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
    );
  });

  return { channel, client };
};

const queryBanner = () => screen.queryByTestId('scheduled-messages-banner');

describe('ScheduledMessagesBanner', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('stays hidden without scheduled messages', async () => {
    await renderComposer();

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('counts the scheduled messages of the channel', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({ cid }),
        generateScheduledMessage({ cid }),
        threadReply(),
      ],
    });

    expect(queryBanner()).toHaveTextContent('2 scheduled messages');
  });

  it('uses the singular for one scheduled message', async () => {
    await renderComposer({ scheduledMessages: [generateScheduledMessage({ cid })] });

    expect(queryBanner()).toHaveTextContent('1 scheduled message');
    expect(queryBanner()).not.toHaveTextContent('1 scheduled messages');
  });

  it('counts only the replies of the thread in a thread composer', async () => {
    await renderComposer({
      inThread: true,
      scheduledMessages: [generateScheduledMessage({ cid }), threadReply()],
    });

    expect(queryBanner()).toHaveTextContent('1 scheduled reply');
  });

  it('stays hidden without the schedule-message capability', async () => {
    await renderComposer({
      canSchedule: false,
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('updates when scheduled message events arrive', async () => {
    const { client } = await renderComposer();
    const scheduledMessage = generateScheduledMessage({ cid });

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: ScheduledMessageEventType.Created,
      }),
    );

    await waitFor(() => expect(queryBanner()).toHaveTextContent('1 scheduled message'));

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: { ...scheduledMessage, status: 'sent' },
        type: ScheduledMessageEventType.Sent,
      }),
    );

    await waitFor(() => expect(queryBanner()).not.toBeInTheDocument());
  });

  it('opens the scheduled message list from View', async () => {
    await renderComposer({
      scheduledMessages: [
        generateScheduledMessage({ cid, message: { text: 'Launch moved to Monday' } }),
      ],
    });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));

    const dialog = await screen.findByTestId('scheduled-message-list-dialog');

    expect(dialog).toHaveTextContent('Scheduled messages');
    expect(dialog).toHaveTextContent('Launch moved to Monday');
  });

  it('titles the list as replies in a thread', async () => {
    await renderComposer({ inThread: true, scheduledMessages: [threadReply()] });

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'View' })));

    expect(await screen.findByTestId('scheduled-message-list-dialog')).toHaveTextContent(
      'Scheduled replies',
    );
  });

  it('can be hidden through the ScheduledMessagesBanner slot', async () => {
    await renderComposer({
      components: { ScheduledMessagesBanner: null },
      scheduledMessages: [generateScheduledMessage({ cid })],
    });

    expect(queryBanner()).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    await renderComposer({ scheduledMessages: [generateScheduledMessage({ cid })] });

    expect(await axe(queryBanner() as HTMLElement)).toHaveNoViolations();
  });
});
