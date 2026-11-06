import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Channel, StreamChat } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';

import { Chat } from '../../Chat';
import { ChannelList } from '../ChannelList';
import { ThemeScopeProvider } from '../../../context/ThemeScopeContext';
import { WithComponents } from '../../../context/WithComponents';
import type { ListLoadErrorIndicatorProps } from '../../Loading';
import { getTestClientWithUser } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

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

  // A live event can route a channel into a list that was never queried (e.g. a message makes a
  // channel unread before the "Unread" list was ever shown): `items` is then defined, but no page
  // was loaded, so the first query still has to run.
  it('queries the first page of a list that a live event reached first', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    paginator.ingestItem(client.channel('messaging', 'ingested'));
    expect(paginator.items).toHaveLength(1);

    renderList(client, paginator);

    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(1));
  });

  it('queries the first page of a list that a live event reached and left again', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    const channel = client.channel('messaging', 'ingested');
    paginator.ingestItem(channel);
    paginator.removeItem({ item: channel });
    expect(paginator.items).toEqual([]);

    renderList(client, paginator);

    await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(1));
  });

  it('does not query a seeded list that a live event reached', async () => {
    const { client, queryChannels } = await setupClient();
    const paginator = new ChannelPaginator({ client, id: 'channels:a' });
    paginator.setItems({ isLastPage: true, valueOrFactory: [] });
    paginator.ingestItem(client.channel('messaging', 'ingested'));

    renderList(client, paginator);

    await waitFor(() => expect(paginator.items).toHaveLength(1));
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

  describe('accessible name', () => {
    // Keeps the assertions on the listbox rather than on the default channel preview.
    const ListItem = ({ item }: { item: Channel }) => (
      <div aria-selected={false} role='option'>
        {item.cid}
      </div>
    );

    const seededPaginator = (client: StreamChat, id: string) => {
      const paginator = new ChannelPaginator({ client, id });
      paginator.setItems({
        isLastPage: true,
        valueOrFactory: [client.channel('messaging', id.replace(':', '-'))],
      });
      client.channelManager.insertPaginator({ paginator });
      return paginator;
    };

    it('names the listbox "Channel list" by default', async () => {
      const { client } = await setupClient();
      const paginator = seededPaginator(client, 'channels:a');

      render(
        <Chat client={client}>
          <WithComponents overrides={{ ListItem }}>
            <ChannelList paginator={paginator} />
          </WithComponents>
        </Chat>,
      );

      expect(screen.getByRole('listbox', { name: 'Channel list' })).toBeInTheDocument();
    });

    it('names the listbox with listboxProps aria-label', async () => {
      const { client } = await setupClient();
      const paginator = seededPaginator(client, 'channels:a');

      render(
        <Chat client={client}>
          <WithComponents overrides={{ ListItem }}>
            <ChannelList
              listboxProps={{ 'aria-label': 'Pinned channels' }}
              paginator={paginator}
            />
          </WithComponents>
        </Chat>,
      );

      expect(
        screen.getByRole('listbox', { name: 'Pinned channels' }),
      ).toBeInTheDocument();
    });

    it('sets both attributes when given both, so the heading names the listbox', async () => {
      const { client } = await setupClient();
      const paginator = seededPaginator(client, 'channels:a');

      render(
        <Chat client={client}>
          <WithComponents overrides={{ ListItem }}>
            <h2 id='inbox-heading'>Inbox</h2>
            <ChannelList
              listboxProps={{
                'aria-label': 'Inbox channels',
                'aria-labelledby': 'inbox-heading',
              }}
              paginator={paginator}
            />
          </WithComponents>
        </Chat>,
      );

      const listbox = screen.getByRole('listbox', { name: 'Inbox' });
      expect(listbox).toHaveAttribute('aria-label', 'Inbox channels');
      expect(listbox).toHaveAttribute('aria-labelledby', 'inbox-heading');
    });

    it('names each listbox after its heading with listboxProps aria-labelledby and passes axe checks', async () => {
      const { client } = await setupClient();
      const pinned = seededPaginator(client, 'channels:pinned');
      const archived = seededPaginator(client, 'channels:archived');

      const { container } = render(
        <Chat client={client}>
          <WithComponents overrides={{ ListItem }}>
            <h2 id='pinned-heading'>Pinned</h2>
            <ChannelList
              listboxProps={{ 'aria-labelledby': 'pinned-heading' }}
              paginator={pinned}
            />
            <h2 id='archived-heading'>Archived</h2>
            <ChannelList
              listboxProps={{ 'aria-labelledby': 'archived-heading' }}
              paginator={archived}
            />
          </WithComponents>
        </Chat>,
      );

      const pinnedList = screen.getByRole('listbox', { name: 'Pinned' });
      expect(pinnedList).toHaveAttribute('aria-labelledby', 'pinned-heading');
      expect(pinnedList).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('listbox', { name: 'Archived' })).toBeInTheDocument();
      expect(
        screen.queryByRole('listbox', { name: 'Channel list' }),
      ).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('when the first page fails to load', () => {
    // No retries inside the paginator, so a single rejected request fails the query.
    const createFailingList = async () => {
      const { client, queryChannels } = await setupClient();
      queryChannels.mockRejectedValueOnce(new Error('query failed'));
      const paginator = new ChannelPaginator({
        client,
        id: 'channels:a',
        paginatorOptions: { retryCount: 0 },
      });
      return { client, paginator, queryChannels };
    };

    it('shows the error with a retry that loads the list', async () => {
      const { client, paginator, queryChannels } = await createFailingList();

      renderList(client, paginator);

      expect(await screen.findByText("Couldn't load conversations")).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(2));
      expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
      expect(screen.queryByText("Couldn't load conversations")).not.toBeInTheDocument();
    });

    it('passes axe checks', async () => {
      const { client, paginator } = await createFailingList();

      const { container } = renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");

      expect(await axe(container)).toHaveNoViolations();
    });

    it('keeps the error and publishes it again when the retry fails too', async () => {
      const { client, paginator, queryChannels } = await createFailingList();
      queryChannels.mockRejectedValueOnce(new Error('query failed again'));
      const addNotification = vi.spyOn(client.notifications, 'add');

      renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));
      expect(paginator.lastQueryError?.message).toBe('query failed again');
      expect(screen.getByText("Couldn't load conversations")).toBeInTheDocument();
      expect(queryChannels).toHaveBeenCalledTimes(2);
    });

    it('keeps the focused button on screen, busy, while the retry runs and after it fails', async () => {
      const { client, paginator, queryChannels } = await createFailingList();
      let rejectRetry: (error: Error) => void = () => undefined;
      queryChannels.mockImplementationOnce(
        () => new Promise((_, reject) => (rejectRetry = reject)) as never,
      );

      renderList(client, paginator);
      const button = await screen.findByRole('button', { name: 'Try again' });
      button.focus();
      fireEvent.click(button);

      await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeInTheDocument();
      expect(document.activeElement).toBe(button);

      act(() => rejectRetry(new Error('query failed again')));

      await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'false'));
      expect(paginator.lastQueryError?.message).toBe('query failed again');
      expect(document.activeElement).toBe(button);
    });

    it('announces a retry that loads the list', async () => {
      const { client, paginator } = await createFailingList();

      renderList(client, paginator);
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
      expect(await screen.findByText('Conversations loaded')).toBeInTheDocument();
    });

    it('announces nothing for a retry that settles after the list unmounted', async () => {
      const { client, paginator, queryChannels } = await createFailingList();
      let resolveRetry: (value: unknown) => void = () => undefined;
      queryChannels.mockImplementationOnce(
        () => new Promise((resolve) => (resolveRetry = resolve)) as never,
      );
      client.channelManager.insertPaginator({ paginator });
      const { rerender } = render(
        <Chat client={client}>
          <ChannelList paginator={paginator} />
        </Chat>,
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
      // Only the list unmounts; `Chat` and its announcer stay.
      rerender(<Chat client={client}>{null}</Chat>);
      act(() => resolveRetry({ channels: [] }));
      await waitFor(() => expect(paginator.items).toEqual([]));
      // Longer than any announcement delay.
      await act(() => new Promise((resolve) => setTimeout(resolve, 100)));

      expect(screen.queryByText('Conversations loaded')).not.toBeInTheDocument();
    });

    it('loads only the first page when connection recovery re-queries the list', async () => {
      const { client, paginator, queryChannels } = await createFailingList();

      const channel = client.channel('messaging', 'recovered');
      queryChannels.mockResolvedValue({ channels: [channel] } as never);
      renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");

      await act(async () => {
        await client.channelManager.recover();
      });
      // Longer than the paginator's query debounce, so a stray debounced query would have run.
      await act(() => new Promise((resolve) => setTimeout(resolve, 500)));

      expect(paginator.items).toEqual([channel]);
      expect(screen.queryByText("Couldn't load conversations")).not.toBeInTheDocument();
      expect(queryChannels).toHaveBeenCalledTimes(2);
    });

    it('renders the ListLoadErrorIndicator override with the error and the retry', async () => {
      const { client, paginator, queryChannels } = await createFailingList();
      const CustomLoadErrorIndicator = ({
        error,
        retry,
      }: ListLoadErrorIndicatorProps) => (
        <button onClick={retry} type='button'>
          {`Custom: ${error.message}`}
        </button>
      );
      client.channelManager.insertPaginator({ paginator });

      render(
        <Chat client={client}>
          <WithComponents
            overrides={{ ListLoadErrorIndicator: CustomLoadErrorIndicator }}
          >
            <ChannelList paginator={paginator} />
          </WithComponents>
        </Chat>,
      );

      fireEvent.click(
        await screen.findByRole('button', { name: 'Custom: query failed' }),
      );

      await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(2));
    });

    it('queries again when the list is reset after the failure', async () => {
      const { client, paginator, queryChannels } = await createFailingList();

      renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");
      expect(queryChannels).toHaveBeenCalledTimes(1);

      // Mirrors `client.disconnectUser()`, which resets every registered list and so clears the
      // error the failed query left.
      act(() => {
        client.channelManager.resetPaginatorStates();
      });

      await waitFor(() => expect(queryChannels).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(paginator.items).toEqual([]));
    });

    it('publishes one error notification for the channel list panel', async () => {
      const { client, paginator } = await createFailingList();
      const addNotification = vi.spyOn(client.notifications, 'add');

      const { unmount } = renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");

      expect(addNotification).toHaveBeenCalledTimes(1);
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Couldn't load conversations",
          options: expect.objectContaining({
            originalError: paginator.lastQueryError,
            severity: 'error',
            tags: ['target:channel-list'],
            type: 'api:channel:query:failed',
          }),
        }),
      );

      // A remounted list shows the same error without publishing it again.
      unmount();
      renderList(client, paginator);
      await screen.findByText("Couldn't load conversations");
      expect(addNotification).toHaveBeenCalledTimes(1);
    });
  });
});
