import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelPaginator, SearchController, UserSearchSource } from 'stream-chat';
import type { StreamChat } from 'stream-chat';

import { Chat } from '../../Chat';
import type { ChatProps } from '../../Chat';
import { ChannelList, type ChannelListProps } from '../ChannelList';
import { ChannelNavigation } from '../ChannelNavigation';
import {
  SearchSourceResults,
  type SearchSourceResultsProps,
} from '../../Search/SearchResults';
import type { ComponentContextValue } from '../../../context/ComponentContext';
import { WithComponents } from '../../../context/WithComponents';
import { ThemeScopeProvider } from '../../../context/ThemeScopeContext';
import { getTestClientWithUser } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

const setupClient = async () => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  // No paginator is registered, so nothing queries.
  vi.spyOn(client, 'queryChannelsAndHydrate').mockRejectedValue(
    new Error('unexpected channel query'),
  );
  return client;
};

const renderNavigation = (
  client: StreamChat,
  chatProps: Partial<Omit<ChatProps, 'client'>> = {},
) =>
  render(
    <Chat client={client} {...chatProps}>
      <ChannelNavigation />
    </Chat>,
  );

describe('ChannelNavigation', () => {
  afterEach(cleanup);

  it('carries the str-chat theme scope on its root outside ChatView', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client, { theme: 'str-chat__theme-dark' });

    const root = container.firstElementChild;
    expect(root).toHaveClass(
      'str-chat',
      'str-chat__theme-dark',
      'str-chat__channel-list',
    );
  });

  it('applies customClasses.chat and customClasses.channelList to its root', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client, {
      customClasses: { channelList: 'custom-channel-list', chat: 'custom-chat' },
    });

    const root = container.firstElementChild;
    expect(root).toHaveClass('custom-chat', 'custom-channel-list');
    expect(root).not.toHaveClass('str-chat');
    expect(root).not.toHaveClass('str-chat__channel-list');
  });

  it('inherits an enclosing theme scope (e.g. ChatView) instead of nesting one', async () => {
    // `.str-chat` declares the whole token set: a nested one would reset tokens an app overrides
    // on the ChatView root, and pick up app CSS written for `.str-chat` roots.
    const client = await setupClient();

    const { container } = render(
      <Chat client={client} customClasses={{ channelList: 'custom-channel-list' }}>
        <ThemeScopeProvider>
          <ChannelNavigation />
        </ThemeScopeProvider>
      </Chat>,
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass('custom-channel-list');
    expect(root).not.toHaveClass('str-chat');
    expect(container.querySelector('.str-chat')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client);

    expect(await axe(container)).toHaveNoViolations();
  });
});

const NoConversations = () => <p>No conversations</p>;
const NoResults = () => <p>Nothing matches your search</p>;

// Scopes the empty state to the search results: wraps the SDK's results in their own overrides.
const ScopedSearchSourceResults = (props: SearchSourceResultsProps) => (
  <WithComponents overrides={{ ListEmptyUI: NoResults }}>
    <SearchSourceResults {...props} />
  </WithComponents>
);

// `ChannelNavigation` renders the channel list, or the search results while search is active.
const renderNavigationWithLists = async (
  overrides: Partial<ComponentContextValue>,
  paginatorIds = ['channels:a'],
) => {
  const client: StreamChat = await getTestClientWithUser({ id: 'user_x' });
  vi.spyOn(client, 'queryChannelsAndHydrate').mockResolvedValue({
    channels: [],
  } as never);
  paginatorIds.forEach((id) => {
    const paginator = new ChannelPaginator({ client, id });
    paginator.setItems({ isLastPage: true, valueOrFactory: [] });
    client.channelManager.insertPaginator({ paginator });
  });
  const userSource = new UserSearchSource(client);
  vi.spyOn(userSource, 'search').mockResolvedValue(undefined);
  const searchController = new SearchController({ client, sources: [userSource] });

  render(
    <Chat client={client} searchController={searchController}>
      <WithComponents overrides={overrides}>
        <ChannelNavigation />
      </WithComponents>
    </Chat>,
  );

  // Search becomes active with a query whose results came back empty.
  const showEmptySearchResults = () =>
    act(() => {
      userSource.state.partialNext({ isActive: true, isLoading: false, items: [] });
      searchController.state.partialNext({ isActive: true, searchQuery: 'zz' });
    });

  return { showEmptySearchResults };
};

describe('ChannelNavigation list-state keys in nested lists', () => {
  afterEach(cleanup);

  it('gives the search results inside ChannelNavigation their own ListEmptyUI through a SearchSourceResults wrapper', async () => {
    const { showEmptySearchResults } = await renderNavigationWithLists({
      ListEmptyUI: NoConversations,
      SearchSourceResults: ScopedSearchSourceResults,
    });

    expect(screen.getByText('No conversations')).toBeInTheDocument();
    expect(screen.queryByText('Nothing matches your search')).not.toBeInTheDocument();

    showEmptySearchResults();

    // Search replaces the channel list, so look inside the results.
    const results = document.querySelector('.str-chat__search-results') as HTMLElement;
    expect(within(results).getByText('Nothing matches your search')).toBeInTheDocument();
    expect(within(results).queryByText('No conversations')).not.toBeInTheDocument();
  });

  it('reaches the search results when their slot is not wrapped', async () => {
    const { showEmptySearchResults } = await renderNavigationWithLists({
      ListEmptyUI: NoConversations,
    });

    showEmptySearchResults();

    expect(screen.getByText('No conversations')).toBeInTheDocument();
    expect(screen.queryByText('Nothing matches your search')).not.toBeInTheDocument();
  });

  it('shows the deprecated EmptyListIndicator for the channel list only, not for the search results', async () => {
    const { showEmptySearchResults } = await renderNavigationWithLists({
      EmptyListIndicator: NoConversations,
    });

    expect(screen.getByText('No conversations')).toBeInTheDocument();

    showEmptySearchResults();

    expect(screen.queryByText('No conversations')).not.toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('gives each channel list its own ListEmptyUI through a ChannelList wrapper', async () => {
    const NoArchived = () => <p>No archived channels</p>;
    const emptyByPaginatorId: Record<string, () => React.JSX.Element> = {
      'channels:archived': NoArchived,
      'channels:mine': NoConversations,
    };
    const ScopedChannelList = (props: ChannelListProps) => (
      <WithComponents overrides={{ ListEmptyUI: emptyByPaginatorId[props.paginator.id] }}>
        <ChannelList {...props} />
      </WithComponents>
    );

    await renderNavigationWithLists({ ChannelList: ScopedChannelList }, [
      'channels:mine',
      'channels:archived',
    ]);

    expect(screen.getByText('No conversations')).toBeInTheDocument();
    expect(screen.getByText('No archived channels')).toBeInTheDocument();
  });
});
