import '../../..';
import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { formatMessage, Thread } from 'stream-chat';

import { Channel } from '../../../components/Channel';
import { Chat } from '../../../components/Chat';
import { MessageComposer } from '../../../components/MessageComposer';
import { ThreadProvider } from '../../../components/Threads';
import { WithComponents } from '../../../context/WithComponents';
import {
  generateMessage,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import type { ChannelDetailProps } from '../ChannelDetail';
import { ScheduledMessagesChannelDetailDialog } from '../ScheduledMessagesChannelDetailDialog';
import type { ScheduledMessageListDialogProps } from '../../../components/ScheduledMessages';

const cid = 'messaging:general';
const parentId = 'parent-1';

const ChannelDetailStub = ({ channel, initialHistory }: ChannelDetailProps) => (
  <div data-testid='channel-detail'>
    {channel.cid} {initialHistory?.map(({ id }) => id).join(',')}
  </div>
);

const ListDialog = (props: ScheduledMessageListDialogProps) => (
  <ScheduledMessagesChannelDetailDialog {...props} ChannelDetail={ChannelDetailStub} />
);

const renderComposer = async ({ inThread = false } = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      {
        channel: {
          id: 'general',
          own_capabilities: ['send-message', 'schedule-message'],
          type: 'messaging',
        },
      },
    ],
    customUser: generateUser({ id: 'user-id' }),
  });
  const scheduledMessage = generateScheduledMessage({
    cid,
    message: inThread
      ? { custom: {}, parent_id: parentId, text: 'reply' }
      : { custom: {}, text: 'Launch moved to Monday' },
  });
  vi.spyOn(client, 'queryScheduledMessages').mockResolvedValue(
    fromPartial({ duration: '', scheduled_messages: [scheduledMessage] }),
  );
  const thread = inThread
    ? new Thread({
        channel,
        client,
        parentMessage: formatMessage(generateMessage({ cid, id: parentId })),
      })
    : undefined;
  const ThreadScope = ({ children }: PropsWithChildren) =>
    thread ? <ThreadProvider thread={thread}>{children}</ThreadProvider> : children;

  await act(() => {
    render(
      <Chat client={client}>
        <WithComponents overrides={{ ScheduledMessageListDialog: ListDialog }}>
          <Channel channel={channel}>
            <ThreadScope>
              <MessageComposer />
            </ThreadScope>
          </Channel>
        </WithComponents>
      </Chat>,
    );
  });

  const viewButton = await screen.findByRole('button', { name: 'View' });
  return { viewButton };
};

describe('ScheduledMessagesChannelDetailDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens the channel details at the scheduled messages section', async () => {
    const { viewButton } = await renderComposer();

    expect(screen.queryByTestId('channel-detail')).not.toBeInTheDocument();
    await act(() => fireEvent.click(viewButton));

    expect(await screen.findByTestId('channel-detail')).toHaveTextContent(
      `${cid} scheduled-messages`,
    );
  });

  it("lists a thread's scheduled replies in the list dialog", async () => {
    const { viewButton } = await renderComposer({ inThread: true });

    await act(() => fireEvent.click(viewButton));

    await waitFor(() =>
      expect(screen.getByTestId('scheduled-message-list-dialog')).toHaveTextContent(
        'Scheduled replies',
      ),
    );
    expect(screen.queryByTestId('channel-detail')).not.toBeInTheDocument();
  });
});
