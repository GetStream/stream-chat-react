import React, { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import { convertTimestampToDate, formatMessage } from 'stream-chat';
import type {
  Channel,
  ChannelLifecycleState,
  ChannelResponse,
  MessageFocusSignalState,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { Avatar as DefaultAvatar } from '../../../components/Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../../components/Avatar/utils';
import { ChannelListItem } from '../../../components/ChannelListItem';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';
import type { TranslationContextValue } from '../../../context';
import { Timestamp } from '../../../components/Message/Timestamp';
import { useStateStore } from '../../../store';

type SearchResultMessage = MessageResponse & { channel?: ChannelResponse };

const pendingDisposalSelector = (state: ChannelLifecycleState) => ({
  pendingDisposal: state.pendingDisposal,
});

/**
 * Reports that a channel opened from a search result failed to load, which nothing else on screen
 * shows: the channel keeps only what the search loaded and gets no new messages. For a user
 * result, the direct-messaging channel was not created.
 */
const reportLoadFailed = ({
  channel,
  client,
  emitter,
  error,
  t,
}: {
  channel: Channel;
  client: StreamChat;
  emitter: string;
  error: unknown;
  t: TranslationContextValue['t'];
}) => {
  client.notifications.addError({
    message: t('search.results.loadChannelFailed.text', 'Failed to load the channel'),
    options: {
      originalError: error instanceof Error ? error : new Error(String(error)),
      type: 'api:channel:watch:failed',
    },
    origin: { context: { channel }, emitter },
  });
};

const messageFocusSignalSelector = (state: MessageFocusSignalState) => ({
  focusedMessageId: state.signal?.messageId,
});

export type ChannelSearchResultItemProps = {
  item: Channel;
  /** Replaces the default selection, which opens the channel in a layout slot. */
  onSelect?: (event: React.MouseEvent) => void;
};

export const ChannelSearchResultItem = ({
  item,
  onSelect,
}: ChannelSearchResultItemProps) => {
  const { openChannel } = useWorkspaceNavigation();
  const { channelManager, client } = useChatContext();
  const { t } = useTranslationContext();

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      // The event is forwarded so an `openChannel` override (via `deriveWorkspaceNavigation`) can
      // honor ⌘/ctrl-click.
      openChannel(item, { event });
      // Neither channel search nor `Channel` watches, so watch here to receive the channel events.
      item.watch().catch((error) =>
        reportLoadFailed({
          channel: item,
          client,
          emitter: 'ChannelSearchResultItem',
          error,
          t,
        }),
      );
      // The channel manager adds it to the lists that own it (deduped by cid, sorted, filtered)
      // without a re-query.
      channelManager.ingestChannel(item);
    },
    [item, openChannel, channelManager, client, onSelect, t],
  );

  return (
    <ChannelListItem
      channel={item}
      className='str-chat__search-result'
      onSelect={handleSelect}
    />
  );
};

export type ChannelByMessageSearchResultItemProps = {
  item: SearchResultMessage;
  /** Replaces the default selection, which jumps to the message and opens its channel. */
  onSelect?: (event: React.MouseEvent) => void;
};

export const MessageSearchResultItem = ({
  item,
  onSelect,
}: ChannelByMessageSearchResultItemProps) => {
  const { channelManager, client } = useChatContext();
  const { isChannelActive, openChannel } = useWorkspaceNavigation();
  const { t } = useTranslationContext();

  // Looked up, not created: message search stores every result's channel and keeps it while the
  // search is active. A message without a stored channel shows no row.
  const cid = item.cid ?? item.channel?.cid;
  const storedChannel = cid ? channelManager.get(cid) : undefined;
  // An ended channel (deleted, user removed, logout) leaves the store without re-rendering this
  // row, so the row subscribes to its disposal state and renders nothing once it is pending.
  const { pendingDisposal } = useStateStore(
    storedChannel?.state,
    pendingDisposalSelector,
  ) ?? { pendingDisposal: false };
  const channel = storedChannel && !pendingDisposal ? storedChannel : undefined;

  const channelOpenInSlot = isChannelActive(channel?.cid ?? undefined);
  const { focusedMessageId } = useStateStore(
    channel?.messagePaginator.messageFocusSignal,
    messageFocusSignalSelector,
  ) ?? { focusedMessageId: undefined };

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      // Read at click time: the rendered instance may have ended since.
      const current = cid ? channelManager.get(cid) : undefined;
      if (!current || current.pendingDisposal) return;
      openChannel(current, { event });
      channelManager.ingestChannel(current);
      // One request loads the page around the message and the channel state, and watches a
      // channel not watched yet (e.g. one a thread created), so it receives its events.
      current.messagePaginator
        .jumpToMessage(item.id, { watchChannel: true })
        .catch((error) =>
          reportLoadFailed({
            channel: current,
            client,
            emitter: 'MessageSearchResultItem',
            error,
            t,
          }),
        );
    },
    [cid, item, openChannel, channelManager, client, onSelect, t],
  );

  // The row previews the matched message, not the channel's latest.
  const previewedMessage = useMemo(() => formatMessage(item), [item]);

  if (!channel) return null;

  return (
    <ChannelListItem
      active={channelOpenInSlot && focusedMessageId === item.id}
      channel={channel}
      className='str-chat__search-result'
      onSelect={handleSelect}
      previewedMessage={previewedMessage}
    />
  );
};

export type UserSearchResultItemProps = {
  item: UserResponse;
  /** Replaces the default selection, which opens a direct-messaging channel with the user. */
  onSelect?: (event: React.MouseEvent) => void;
};

export const UserSearchResultItem = ({ item, onSelect }: UserSearchResultItemProps) => {
  const { channelManager, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const { directMessagingChannelType } = useSearchContext();
  const { t } = useTranslationContext();
  const { Avatar = DefaultAvatar, extractDisplayInfo = defaultExtractDisplayInfo } =
    useComponentContext();

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      const newChannel = client.channel(directMessagingChannelType, {
        members: [{ user_id: client.userId as string }, { user_id: item.id }],
      });
      // The event is forwarded so an `openChannel` override can honor ⌘/ctrl-click.
      openChannel(newChannel, { event });
      newChannel.watch().then(
        // Listed only once the watch gives a new DM its ID, since lists refuse a channel without
        // one. `watch()` resolves with the stored instance if another took that ID
        // meanwhile.
        (channel) => channelManager.ingestChannel(channel),
        (error) =>
          reportLoadFailed({
            channel: newChannel,
            client,
            emitter: 'UserSearchResultItem',
            error,
            t,
          }),
      );
    },
    [client, item, openChannel, channelManager, directMessagingChannelType, onSelect, t],
  );

  return (
    <div className='str-chat__search-result-container'>
      <button
        aria-label={t(
          'search.resultItem.selectUserChannel.ariaLabel',
          'Select User Channel: {{ name }}',
          {
            name: item.name || '',
          },
        )}
        className='str-chat__search-result str-chat__search-result--user'
        data-testid='search-result-user'
        onClick={onClick}
        role='option'
      >
        <Avatar
          {...extractDisplayInfo({ user: item })}
          isOnline={item.online}
          size='xl'
        />
        <div className='str-chat__search-result-data'>
          <div className='str-chat__search-result__display-name'>
            {/* @ts-expect-error username is not typed */}
            {item.name || item.custom?.username || item.id}
          </div>
          <Timestamp
            customClass='str-chat__search-result__last-active-timestamp'
            timestamp={convertTimestampToDate(item.last_active)}
          />
        </div>
      </button>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchResultItemComponents = Record<string, ComponentType<{ item: any }>>;

export const DefaultSearchResultItems: SearchResultItemComponents = {
  channels: ChannelSearchResultItem,
  messages: MessageSearchResultItem,
  users: UserSearchResultItem,
};
