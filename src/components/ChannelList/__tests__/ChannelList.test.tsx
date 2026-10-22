import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StreamChat } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';

import { Chat } from '../../Chat';
import { ChannelList } from '../ChannelList';
import { ThemeScopeProvider } from '../../../context/ThemeScopeContext';
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

  it('brings a layout-neutral theme scope when rendered on its own', async () => {
    const { client } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    paginator.setItems({ isLastPage: true, valueOrFactory: [] });

    const { container } = renderList(client, paginator);

    const scope = container.firstElementChild;
    expect(scope).toHaveClass('str-chat', 'messaging', 'light', 'str-chat__theme-scope');
  });

  it('adds no theme scope inside an existing one', async () => {
    const { client } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    paginator.setItems({ isLastPage: true, valueOrFactory: [] });
    client.channelManager.insertPaginator({ paginator });

    const { container } = render(
      <Chat client={client}>
        <ThemeScopeProvider>
          <ChannelList paginator={paginator} />
        </ThemeScopeProvider>
      </Chat>,
    );

    expect(container.querySelector('.str-chat')).not.toBeInTheDocument();
  });

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
    // A loaded but empty page, e.g. a catch-all list seeded so it never auto-queries.
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

    // Mirrors `client.disconnectUser()`, which resets every registered list. The paginator outlives
    // the component, so a mount-only query would leave the list empty forever.
    act(() => {
      client.channelManager.resetPaginatorStates();
    });

    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(paginator.items).toEqual([]));
  });
});
