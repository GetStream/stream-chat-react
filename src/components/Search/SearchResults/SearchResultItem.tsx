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
 * Reports that a channel opened from a search result failed to load: its watch request failed, so it
 * shows only what the search loaded and receives no new messages, which nothing on screen would show
 * otherwise. For a direct message opened from a user result, the channel was not created.
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
  /** Overrides selection, exactly like `ChannelListItem`'s `onSelect`: when provided it runs
   *  instead of the default (open the channel into a layout slot). */
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
      // Default: open the channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` (e.g. via ChatView's `deriveWorkspaceNavigation`) can honor ⌘/ctrl-click.
      openChannel(item, { event });
      // Channel search doesn't watch its results, and `Channel` doesn't watch either, so the opened
      // channel is watched here to receive its events.
      item.ensureWatched().catch((error) =>
        reportLoadFailed({
          channel: item,
          client,
          emitter: 'ChannelSearchResultItem',
          error,
          t,
        }),
      );
      // Route the channel into the list(s) that should own it (the channel manager dedupes by cid,
      // inserts in sort order, and honors ownership/filters) so it appears without a re-query.
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
  /** Overrides selection (see `ChannelSearchResultItem`); when provided it runs instead of the
   *  default (jump to the message and open its channel). */
  onSelect?: (event: React.MouseEvent) => void;
};

export const MessageSearchResultItem = ({
  item,
  onSelect,
}: ChannelByMessageSearchResultItemProps) => {
  const { channelManager } = useChatContext();
  const { isChannelActive, openChannel } = useWorkspaceNavigation();

  // Looked up, not created: the message search stores every result's channel before returning it
  // and keeps it stored while the search is active. A message without a channel shows no row.
  const cid = item.cid ?? item.channel?.cid;
  const storedChannel = cid ? channelManager.get(cid) : undefined;
  // A channel that ends (deleted, the user removed, logout) is disposed and leaves the store without
  // re-rendering this row, so the row follows the disposal: it then looks the channel up again and
  // shows nothing while none is stored.
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
      // the stored instance at the time of the click: the one rendered may have ended since
      const current = cid ? channelManager.get(cid) : undefined;
      if (!current || current.pendingDisposal) return;
      openChannel(current, { event });
      channelManager.ingestChannel(current);
      // A channel stored but not watched, such as one a thread created, is watched with the request
      // that loads the message, so it receives its events.
      void current.messagePaginator.jumpToMessage(item.id, { watchChannel: true });
    },
    [cid, item, openChannel, channelManager, onSelect],
  );

  // Preview the matched message itself (not the channel's latest) by overriding `previewedMessage`.
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
  /** Overrides selection (see `ChannelSearchResultItem`); when provided it runs instead of the
   *  default (open a direct-messaging channel with the user). */
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
      const newChannel = channelManager.ensure({
        data: {
          members: [{ user_id: client.userId as string }, { user_id: item.id }],
        },
        type: directMessagingChannelType,
      });
      // Default: open the DM channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` can honor ⌘/ctrl-click.
      openChannel(newChannel, { event });
      newChannel.ensureWatched().then(
        // Listed only once the watch gives a new DM its id (lists refuse a channel without one).
        // `ensureWatched()` resolves with the stored instance if another one took that id meanwhile.
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
