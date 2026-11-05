import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';

import { AvatarWithChannelDetail } from '../AvatarWithChannelDetail';
import type { ChannelDetailProps } from '../ChannelDetail';
import { ChannelDetailProvider, useChannelDetailContext } from '../ChannelDetailContext';
import {
  ChannelInstanceProvider,
  ChatProvider,
  ModalDialogManagerProvider,
} from '../../../context';
import { getTestClientWithUser, mockChatContext } from '../../../mock-builders';

const ChannelDetailCloseButton = () => {
  const { close } = useChannelDetailContext();

  return close ? (
    <button onClick={close} type='button'>
      Close
    </button>
  ) : null;
};

// Closes the way the default views do.
const ChannelDetailStub = ({ channel }: ChannelDetailProps) => (
  <ChannelDetailProvider channel={channel}>
    <div data-testid='channel-detail'>
      <ChannelDetailCloseButton />
    </div>
  </ChannelDetailProvider>
);

describe('AvatarWithChannelDetail', () => {
  let client: StreamChat;
  let channel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'alice' });
    // Created locally (e.g. a "new conversation" flow), so the server does not have it yet.
    channel = client.channel('messaging', 'local');
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

  it("closes the modal from the channel detail's close button", () => {
    channel.initialized = true;
    renderAvatar();

    fireEvent.click(openButton());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByTestId('channel-detail')).not.toBeInTheDocument();
  });

  it('is enabled for a channel restored from the offline database', () => {
    channel.offlineMode = true;

    renderAvatar();

    expect(openButton()).toBeEnabled();
  });
});
