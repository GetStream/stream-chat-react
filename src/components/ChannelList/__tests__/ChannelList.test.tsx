import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StreamChat } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';

import { Chat } from '../../Chat';
import { ChannelList } from '../ChannelList';
import { getTestClientWithUser } from '../../../mock-builders';

const setupClient = async () => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  const queryChannels = vi
    .spyOn(client, 'queryChannelsAndHydrate')
    .mockResolvedValue({ channels: [] } as never);
  return { client, queryChannels };
};

const renderList = (client: StreamChat, paginator: ChannelPaginator) => {
  client.channelManager.insertPaginator({ paginator });
  return render(
    <Chat client={client}>
      <ChannelList paginator={paginator} />
    </Chat>,
  );
};

describe('ChannelList', () => {
  afterEach(cleanup);

  it('queries the first page of a list that has never been queried', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });

    renderList(client, paginator);

    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(paginator.items).toEqual([]));
  });

  it('does not query a list that already has a loaded page', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    // a loaded but empty page — e.g. a catch-all list seeded so it never auto-queries
    paginator.setItems({ isLastPage: true, valueOrFactory: [] });

    renderList(client, paginator);

    await waitFor(() => expect(paginator.items).toEqual([]));
    expect(queryChannels).not.toHaveBeenCalled();
  });

  it('re-queries when the list data is discarded while it stays mounted', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });

    renderList(client, paginator);
    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(1));

    // what `client.disconnectUser()` does to every registered list: the loaded channels belong to
    // the user that is going away. The paginator outlives the component, so a mount-only query
    // would leave the list empty forever.
    act(() => {
      client.channelManager.resetPaginatorStates();
    });

    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(paginator.items).toEqual([]));
  });
});
