import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';

import { AvatarWithChannelDetail } from '../AvatarWithChannelDetail';
import {
  ChannelInstanceProvider,
  ChatProvider,
  ModalDialogManagerProvider,
} from '../../../context';
import { getTestClientWithUser, mockChatContext } from '../../../mock-builders';

const ChannelDetailStub = () => <div data-testid='channel-detail' />;

describe('AvatarWithChannelDetail', () => {
  let client: StreamChat;
  let channel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'alice' });
    // created locally, e.g. by a "new conversation" flow: the server doesn't have it yet
    channel = client.channelManager.ensure({ id: 'local', type: 'messaging' });
  });

  const renderAvatar = () =>
    render(
      <ChatProvider value={mockChatContext({ client })}>
        <ModalDialogManagerProvider>
          <ChannelInstanceProvider value={{ channel }}>
            <AvatarWithChannelDetail ChannelDetail={ChannelDetailStub} />
          </ChannelInstanceProvider>
        </ModalDialogManagerProvider>
      </ChatProvider>,
    );

  const openButton = () => screen.getByRole('button', { name: 'Open channel details' });

  it('is disabled for a channel the server does not have yet', () => {
    renderAvatar();

    expect(openButton()).toBeDisabled();
    fireEvent.click(openButton());
    expect(screen.queryByTestId('channel-detail')).not.toBeInTheDocument();
  });

  it('enables once the server has created the channel', () => {
    renderAvatar();

    act(() => {
      channel.initialized = true;
    });
    fireEvent.click(openButton());

    expect(openButton()).toBeEnabled();
    expect(screen.getByTestId('channel-detail')).toBeInTheDocument();
  });

  it('is enabled for a channel restored from the offline database', () => {
    channel.offlineMode = true;

    renderAvatar();

    expect(openButton()).toBeEnabled();
  });
});
