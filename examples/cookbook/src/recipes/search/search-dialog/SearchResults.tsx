import { useId } from 'react';
import type { MouseEvent, PropsWithChildren } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import type {
  Channel,
  ChannelStateData,
  MessageResponse,
  SearchControllerState,
  SearchSource,
  SearchSourceState,
  TimestampNS,
  UserResponse,
} from 'stream-chat';
import {
  Avatar,
  useChannelDisplayName,
  useChatContext,
  useStateStore,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import { getDialogSources } from './searchController';
import './SearchResults.css';

export type ResultsLayout = 'grouped' | 'mixed';

const sourceLabels: Record<string, string> = {
  channels: 'Channels',
  messages: 'Messages',
  users: 'People',
};

const tagLabels: Record<string, string> = {
  channels: 'Channel',
  messages: 'Message',
  users: 'Person',
};

type Result =
  | { item: Channel; type: 'channels' }
  | { item: MessageResponse; type: 'messages' }
  | { item: UserResponse; type: 'users' };

const resultKey = ({ item, type }: Result) =>
  `${type}:${type === 'channels' ? item.cid : item.id}`;

// The time a mixed list sorts by: a channel's last message, a person's last activity, a message's
// creation. The SDK keeps timestamps as nanosecond numbers.
const resultTime = (result: Result) => {
  const timestamp =
    result.type === 'channels'
      ? result.item.data?.last_message_at
      : result.type === 'users'
        ? result.item.last_active
        : result.item.created_at;
  return convertTimestampToDate(timestamp)?.getTime() ?? 0;
};

const formatDate = (timestamp?: TimestampNS | null) =>
  convertTimestampToDate(timestamp)?.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });

// The avatar repeats the row's name, so it's hidden from assistive technology. Avatar renders
// role="button" by default, which a result row mustn't announce.
const decorative = { 'aria-hidden': true, role: 'presentation' } as const;

const memberCountSelector = ({ memberCount }: ChannelStateData) => ({ memberCount });

const sourceSelector = ({
  hasNext,
  isActive,
  isLoading,
  items,
  lastQueryError,
  searchQuery,
}: SearchSourceState) => ({
  hasNext,
  isActive,
  isLoading,
  items,
  lastQueryError,
  searchQuery,
});

const searchQuerySelector = ({ searchQuery }: SearchControllerState) => ({
  searchQuery,
});

/** Opens what a result points to, then closes the dialog. */
const useOpenResult = (close: () => void) => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();

  const reportError = (error: Error) =>
    client.notifications.addError({
      message: 'Failed to load the channel',
      options: { originalError: error },
      origin: { emitter: 'SearchDialog' },
    });

  return async ({ item, type }: Result, event: MouseEvent) => {
    close();
    if (type === 'channels') {
      openChannel(item, { event });
      // Channel search doesn't watch its results, so watch the channel to receive its events.
      item.watch().catch(reportError);
      channelManager.ingestChannel(item);
      return;
    }
    if (type === 'messages') {
      // Message search stores every result's channel.
      const channel = item.cid ? channelManager.get(item.cid) : undefined;
      if (!channel) return;
      openChannel(channel, { event });
      channelManager.ingestChannel(channel);
      // Loads the page around the message, scrolls to it and watches the channel.
      channel.messagePaginator
        .jumpToMessage(item.id, { watchChannel: true })
        .catch(reportError);
      return;
    }
    // A person opens the user's direct conversation with them, if there is one: a channel with only
    // the two of them and no name of its own.
    try {
      const channels = await client.queryChannelsAndHydrate(
        {
          filter_conditions: {
            $and: [
              { members: { $in: [client.userId ?? ''] } },
              { members: { $in: [item.id] } },
            ],
            member_count: 2,
            type: 'messaging',
          },
        },
        { withResponse: false },
      );
      const directMessage = channels.find(
        (channel) => !('name' in (channel.data?.custom ?? {})),
      );
      if (!directMessage) {
        client.notifications.addInfo({
          message: `No conversation with ${item.name ?? item.id} yet`,
          origin: { emitter: 'SearchDialog' },
        });
        return;
      }
      openChannel(directMessage, { event });
      channelManager.ingestChannel(directMessage);
    } catch (error) {
      reportError(error as Error);
    }
  };
};

type ResultRowProps = {
  onOpen: (result: Result, event: MouseEvent) => void;
  result: Result;
  showTag?: boolean;
};

/**
 * Opens the result. The avatar sits beside the button, since a button can't contain the SDK's
 * Avatar, a `div`; the button's `::after` covers the whole row, so a click on the avatar opens the
 * result too.
 */
const ResultButton = ({
  children,
  onOpen,
  result,
  showTag,
}: PropsWithChildren<ResultRowProps>) => (
  <button
    className='cookbook-search-result__button'
    data-search-result
    onClick={(event) => void onOpen(result, event)}
    type='button'
  >
    <span className='cookbook-search-result__text'>{children}</span>
    {showTag && (
      <span className='cookbook-search-result__tag'>{tagLabels[result.type]}</span>
    )}
  </button>
);

const ChannelResult = ({ channel, ...row }: ResultRowProps & { channel: Channel }) => {
  const name = useChannelDisplayName(channel) ?? channel.id ?? '';
  const { memberCount } = useStateStore(channel.state, memberCountSelector);
  return (
    <>
      <Avatar {...decorative} size='md' userName={name} />
      <ResultButton {...row}>
        <span className='cookbook-search-result__title'>{name}</span>
        <span className='cookbook-search-result__detail'>{memberCount} members</span>
      </ResultButton>
    </>
  );
};

const UserResult = ({ user, ...row }: ResultRowProps & { user: UserResponse }) => (
  <>
    <Avatar
      {...decorative}
      imageUrl={user.image}
      size='md'
      userName={user.name ?? user.id}
    />
    <ResultButton {...row}>
      <span className='cookbook-search-result__title'>{user.name ?? user.id}</span>
      <span className='cookbook-search-result__detail'>
        {user.last_active ? `Active ${formatDate(user.last_active)}` : 'Person'}
      </span>
    </ResultButton>
  </>
);

const MessageResult = ({
  message,
  ...row
}: ResultRowProps & { message: MessageResponse }) => {
  const { channelManager } = useChatContext();
  const channel = message.cid ? channelManager.get(message.cid) : undefined;
  const channelName = useChannelDisplayName(channel);
  const author = message.user?.name ?? message.user?.id ?? '';
  return (
    <>
      <Avatar
        {...decorative}
        imageUrl={message.user?.image}
        size='md'
        userName={author}
      />
      <ResultButton {...row}>
        <span className='cookbook-search-result__title'>{message.text}</span>
        <span className='cookbook-search-result__detail'>
          {author}
          {channelName && ` in ${channelName}`} · {formatDate(message.created_at)}
        </span>
      </ResultButton>
    </>
  );
};

const ResultRow = (props: ResultRowProps) => {
  const { result } = props;
  return (
    <li className='cookbook-search-result'>
      {result.type === 'channels' && <ChannelResult {...props} channel={result.item} />}
      {result.type === 'users' && <UserResult {...props} user={result.item} />}
      {result.type === 'messages' && <MessageResult {...props} message={result.item} />}
    </li>
  );
};

/**
 * What one source has loaded, as results. A source waits for a pause in typing before it queries,
 * so until its own `searchQuery` is the controller's, it's still searching.
 */
const useSourceResults = (source: SearchSource | undefined, searchQuery: string) => {
  const state = useStateStore(source?.state, sourceSelector);
  const results = (state?.items ?? []).map(
    (item) => ({ item, type: source?.type }) as Result,
  );
  const isSearching = !!state && (state.isLoading || state.searchQuery !== searchQuery);
  return { ...state, isSearching, results, source };
};

type SourceResults = ReturnType<typeof useSourceResults>;

// Hidden while a source is searching, so it never loads the next page of the previous text.
const hasMore = ({ hasNext, isSearching, items }: SourceResults) =>
  !!items?.length && hasNext && !isSearching;

const GroupedResults = ({
  groups,
  onOpen,
}: {
  groups: SourceResults[];
  onOpen: ResultRowProps['onOpen'];
}) => {
  const headingId = useId();
  return groups.map((group) => {
    const type = group.source?.type ?? '';
    return (
      <section
        aria-labelledby={`${headingId}-${type}`}
        className='cookbook-search-results__group'
        key={type}
      >
        <h3 className='cookbook-search-results__heading' id={`${headingId}-${type}`}>
          {sourceLabels[type]}
        </h3>
        {group.lastQueryError ? (
          <p className='cookbook-search-results__note'>This search failed.</p>
        ) : group.results.length ? (
          <ul className='cookbook-search-results__list'>
            {group.results.map((result) => (
              <ResultRow key={resultKey(result)} onOpen={onOpen} result={result} />
            ))}
          </ul>
        ) : (
          <p className='cookbook-search-results__note'>
            {group.isSearching ? 'Searching…' : 'No results'}
          </p>
        )}
        {hasMore(group) && (
          <button
            className='cookbook-search-results__more'
            onClick={() => void group.source?.search()}
            type='button'
          >
            Load more {sourceLabels[type].toLowerCase()}
          </button>
        )}
      </section>
    );
  });
};

const MixedResults = ({
  groups,
  onOpen,
}: {
  groups: SourceResults[];
  onOpen: ResultRowProps['onOpen'];
}) => {
  const results = groups
    .flatMap((group) => group.results)
    .sort((a, b) => resultTime(b) - resultTime(a));
  const loadable = groups.filter(hasMore);
  return (
    <>
      {results.length ? (
        <ul aria-label='Results' className='cookbook-search-results__list'>
          {results.map((result) => (
            <ResultRow key={resultKey(result)} onOpen={onOpen} result={result} showTag />
          ))}
        </ul>
      ) : (
        <p className='cookbook-search-results__note'>
          {groups.some((group) => group.isSearching) ? 'Searching…' : 'No results'}
        </p>
      )}
      {!!loadable.length && (
        <button
          className='cookbook-search-results__more'
          onClick={() => loadable.forEach((group) => void group.source?.search())}
          type='button'
        >
          Load more
        </button>
      )}
    </>
  );
};

type SearchResultsProps = {
  close: () => void;
  layout: ResultsLayout;
};

export const SearchResults = ({ close, layout }: SearchResultsProps) => {
  const { searchController } = useChatContext();
  const { searchQuery = '' } = useStateStore(searchController.state, searchQuerySelector);
  const sources = getDialogSources(searchController);
  const groups = [
    useSourceResults(sources.channels, searchQuery),
    useSourceResults(sources.users, searchQuery),
    useSourceResults(sources.messages, searchQuery),
  ].filter((group) => group.isActive);
  const onOpen = useOpenResult(close);
  const resultCount = groups.reduce((count, group) => count + group.results.length, 0);
  const isSearching = groups.some((group) => group.isSearching);

  return (
    <div className='cookbook-search-results'>
      <p className='cookbook-search-results__status' role='status'>
        {isSearching ? 'Searching…' : `${resultCount} results`}
      </p>
      {layout === 'grouped' ? (
        <GroupedResults groups={groups} onOpen={onOpen} />
      ) : (
        <MixedResults groups={groups} onOpen={onOpen} />
      )}
    </div>
  );
};
