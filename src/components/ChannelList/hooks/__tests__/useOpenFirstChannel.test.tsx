import React, { useMemo, useState } from 'react';
import { act, render } from '@testing-library/react';
import type { Mock } from 'vitest';
import { ChannelPaginator } from 'stream-chat';
import type {
  Channel as StreamChannel,
  StreamChat,
  Thread as StreamThread,
} from 'stream-chat';

import { getTestClientWithUser } from '../../../../mock-builders';
import { createWorkspaceNavigation } from '../../../../context/createWorkspaceNavigation';
import {
  useWorkspaceNavigation,
  WorkspaceNavigationProvider,
} from '../../../../context/WorkspaceNavigationContext';
import { useOpenFirstChannel } from '../useOpenFirstChannel';
import { Chat } from '../../../Chat';
import { ChatView, useChatViewContext } from '../../../../plugins/SlotLayout';

import type { PropsWithChildren } from 'react';
import type { WorkspaceNavigation } from '../../../../context/WorkspaceNavigationContext';

describe('useOpenFirstChannel', () => {
  let client: StreamChat;
  let paginator: ChannelPaginator;
  let channelA: StreamChannel;
  let channelB: StreamChannel;
  let navigation: WorkspaceNavigation;
  let openChannel: Mock<(channel: StreamChannel) => void>;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'ann' });
    paginator = new ChannelPaginator({ client, id: 'list' });
    channelA = client.channel('messaging', 'a');
    channelB = client.channel('messaging', 'b');
    openChannel = vi.fn();
  });

  // Navigation held in React state, as an app without ChatView holds it, so `openChannels`
  // reflects what the hook opened. `openChannel` is spied to count the opens.
  const NavigationRoot = ({ children }: PropsWithChildren) => {
    const [channel, setChannel] = useState<StreamChannel>();
    const [thread, setThread] = useState<StreamThread>();
    navigation = useMemo(() => {
      const base = createWorkspaceNavigation({ channel, setChannel, setThread, thread });
      return {
        ...base,
        openChannel: (next, options) => {
          openChannel(next);
          base.openChannel(next, options);
        },
      };
    }, [channel, thread]);
    return (
      <WorkspaceNavigationProvider value={navigation}>
        {children}
      </WorkspaceNavigationProvider>
    );
  };

  const Sidebar = () => {
    useOpenFirstChannel(paginator);
    return null;
  };

  const renderSidebar = () => {
    const Root = ({ showSidebar }: { showSidebar: boolean }) => (
      <NavigationRoot>{showSidebar && <Sidebar />}</NavigationRoot>
    );
    const result = render(<Root showSidebar />);
    return {
      mountSidebar: () => result.rerender(<Root showSidebar />),
      unmountSidebar: () => result.rerender(<Root showSidebar={false} />),
    };
  };

  const loadPage = (items: StreamChannel[] | undefined) =>
    act(() => {
      paginator.state.partialNext({ items });
    });

  it('opens the first channel once the first page loads', () => {
    renderSidebar();
    expect(openChannel).not.toHaveBeenCalled();

    loadPage([channelA, channelB]);

    expect(openChannel).toHaveBeenCalledTimes(1);
    expect(openChannel).toHaveBeenCalledWith(channelA);
    expect(navigation.openChannels).toEqual([channelA]);
  });

  it('opens the first channel of a page loaded before it mounted', () => {
    loadPage([channelA, channelB]);

    renderSidebar();

    expect(openChannel).toHaveBeenCalledWith(channelA);
  });

  it('does not re-open the first channel over the picked one when remounted', () => {
    const { mountSidebar, unmountSidebar } = renderSidebar();
    loadPage([channelA, channelB]);
    act(() => navigation.openChannel(channelB));
    openChannel.mockClear();

    unmountSidebar();
    mountSidebar();

    expect(openChannel).not.toHaveBeenCalled();
    expect(navigation.openChannels).toEqual([channelB]);
  });

  it('does not open a channel that moves to the top of a loaded list', () => {
    renderSidebar();
    loadPage([channelA]);
    act(() => navigation.closeChannel(channelA.cid));
    openChannel.mockClear();

    loadPage([channelB, channelA]);

    expect(openChannel).not.toHaveBeenCalled();
    expect(navigation.openChannels).toEqual([]);
  });

  it('opens nothing for an empty first page, nor for a channel that arrives later', () => {
    renderSidebar();

    loadPage([]);
    loadPage([channelA]);

    expect(openChannel).not.toHaveBeenCalled();
  });

  it('opens the first channel again when the list reloads after a reset', () => {
    renderSidebar();
    loadPage([channelA]);
    act(() => navigation.closeChannel(channelA.cid));
    openChannel.mockClear();

    loadPage(undefined);
    loadPage([channelB]);

    expect(openChannel).toHaveBeenCalledWith(channelB);
  });

  it('does not throw without a navigation provider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Sidebar />);

    expect(() => loadPage([channelA])).not.toThrow();
    warn.mockRestore();
  });

  it('does not re-open the first channel when a ChatView view switch remounts it', () => {
    let setActiveView: ReturnType<typeof useChatViewContext>['setActiveView'] = () =>
      undefined;
    // Like a channel list, rendered only in the channels view.
    const ChannelsViewSidebar = () => {
      const chatView = useChatViewContext();
      setActiveView = chatView.setActiveView;
      navigation = useWorkspaceNavigation();
      return chatView.activeView === 'channels' ? <Sidebar /> : null;
    };
    render(
      <Chat client={client}>
        <ChatView>
          <ChannelsViewSidebar />
        </ChatView>
      </Chat>,
    );

    loadPage([channelA, channelB]);
    expect(navigation.openChannels).toEqual([channelA]);
    act(() => navigation.openChannel(channelB));
    expect(navigation.openChannels).toEqual([channelB]);

    act(() => setActiveView('threads'));
    act(() => setActiveView('channels'));

    expect(navigation.openChannels).toEqual([channelB]);
  });
});
