import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  Channel,
  ChannelPaginator as ChannelPaginatorType,
  StreamChat,
} from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';

import { Chat } from '../../Chat';
import { ChannelLists } from '../ChannelLists';
import { useChannelListContext } from '../../../context/ChannelListContext';
import { ComponentProvider } from '../../../context/ComponentContext';
import { getTestClientWithUser } from '../../../mock-builders';

/**
 * Keeps the assertions on the list composition rather than on the default channel preview. Also
 * reports the primary paginator `ChannelLists` provides to the list subtree.
 */
const ListItem = ({ item }: { item: Channel }) => (
  <div data-primary-paginator={useChannelListContext().paginator?.id} role='option'>
    {item.cid}
  </div>
);

const setupClient = async () => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  // no list in these tests should reach the network — they are seeded instead
  vi.spyOn(client, 'queryChannelsAndHydrate').mockRejectedValue(
    new Error('unexpected channel query'),
  );
  return client;
};

/** A paginator with a single loaded page, so it renders a list without querying. */
const seededPaginator = (client: StreamChat, id: string) => {
  const paginator = new ChannelPaginator({ client, id });
  paginator.setItems({
    isLastPage: true,
    valueOrFactory: [client.channel('messaging', id.replace(':', '-'))],
  });
  return paginator;
};

const renderLists = (client: StreamChat, paginators: ChannelPaginatorType[]) => {
  paginators.forEach((paginator) => client.channelManager.insertPaginator({ paginator }));
  return render(
    <Chat client={client}>
      <ComponentProvider value={{ ListItem }}>
        <ChannelLists />
      </ComponentProvider>
    </Chat>,
  );
};

describe('ChannelLists', () => {
  afterEach(cleanup);

  it('renders one list per paginator registered on the client channel manager', async () => {
    const client = await setupClient();

    renderLists(client, [
      seededPaginator(client, 'channels:a'),
      seededPaginator(client, 'channels:b'),
    ]);

    await waitFor(() => expect(screen.getAllByRole('listbox')).toHaveLength(2));
  });

  it('renders a list for a paginator inserted after mount and drops it on removal', async () => {
    const client = await setupClient();

    renderLists(client, [seededPaginator(client, 'channels:a')]);
    await waitFor(() => expect(screen.getAllByRole('listbox')).toHaveLength(1));

    const added = seededPaginator(client, 'channels:b');
    act(() => {
      client.channelManager.insertPaginator({ paginator: added });
    });
    await waitFor(() => expect(screen.getAllByRole('listbox')).toHaveLength(2));

    act(() => {
      client.channelManager.removePaginator(added);
    });
    await waitFor(() => expect(screen.getAllByRole('listbox')).toHaveLength(1));
  });

  it('exposes the first registered paginator to the lists as the primary one', async () => {
    const client = await setupClient();
    const first = seededPaginator(client, 'channels:a');
    const second = seededPaginator(client, 'channels:b');

    renderLists(client, [first, second]);

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(client.channelManager.paginators[0]).toBe(first);
    // every list — not just the first — sees `paginators[0]` as the primary paginator
    screen.getAllByRole('option').forEach((option) => {
      expect(option).toHaveAttribute('data-primary-paginator', first.id);
    });
  });

  it('registers the channel manager subscriptions while a list is mounted', async () => {
    const client = await setupClient();

    const { unmount } = renderLists(client, [seededPaginator(client, 'channels:a')]);

    await waitFor(() => expect(client.channelManager.hasSubscriptions).toBe(true));

    act(() => {
      unmount();
    });

    expect(client.channelManager.hasSubscriptions).toBe(false);
  });
});
