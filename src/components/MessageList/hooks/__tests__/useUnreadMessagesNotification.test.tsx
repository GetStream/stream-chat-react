import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { useUnreadMessagesNotification } from '../MessageList';
import { initClientWithChannels } from '../../../../mock-builders';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from '../../UnreadMessagesSeparator';

const lists: HTMLDivElement[] = [];

const makeList = (withSeparator: boolean) => {
  const list = document.createElement('div');
  lists.push(list);
  if (withSeparator) {
    const separator = document.createElement('div');
    separator.className = UNREAD_MESSAGE_SEPARATOR_CLASS;
    list.appendChild(separator);
  }
  document.body.appendChild(list);
  return list;
};

// The hook reads the unread count from `channel.messagePaginator.unreadStateSnapshot`, seeded after
// the <Channel> bootstrap, whose first-page query re-derives it from `channel.state.read`.
const render = async (listElement: HTMLDivElement) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  const utils = renderHook(
    () =>
      useUnreadMessagesNotification({
        isMessageListScrolledToBottom: false,
        listElement,
        showAlways: false,
      }),
    { wrapper },
  );
  await act(async () => {
    await Promise.resolve();
  });
  await act(() => {
    channel.messagePaginator.setUnreadSnapshot({ lastReadAt: null, unreadCount: 2 });
  });
  return utils;
};

// Several lists can be on screen at once (channels side by side), so each list follows only the
// separator inside its own scroll container, never the first one in the page.
describe('useUnreadMessagesNotification', () => {
  const observed: Element[] = [];
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeEach(() => {
    observed.length = 0;
    window.IntersectionObserver = class {
      disconnect() {}
      observe(target: Element) {
        observed.push(target);
      }
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    lists.splice(0).forEach((list) => list.remove());
  });

  it("observes its own list's separator when another list's separator comes first in the page", async () => {
    makeList(true);
    const ownList = makeList(true);

    await render(ownList);

    expect(observed.length).toBeGreaterThan(0);
    expect(observed.every((target) => ownList.contains(target))).toBe(true);
  });

  it("ignores another list's separator when its own list renders none", async () => {
    makeList(true);
    const ownList = makeList(false);

    const { result } = await render(ownList);

    expect(observed).toEqual([]);
    expect(result.current.show).toBe(true);
    expect(result.current.unreadIsBelow).toBeUndefined();
  });
});
