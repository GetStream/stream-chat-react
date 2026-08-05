import React, { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import { formatMessage } from 'stream-chat';
import type {
  Channel,
  ChannelResponse,
  MessageResponse,
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
import { Timestamp } from '../../../components/Message/Timestamp';

type SearchResultMessage = MessageResponse & { channel?: ChannelResponse };

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
  const { channelManager } = useChatContext();

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      // Default: open the channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` (e.g. via ChatView's `deriveWorkspaceNavigation`) can honor ⌘/ctrl-click.
      openChannel(item, { event });
      // Route the channel into the list(s) that should own it (the channel manager dedupes by cid,
      // inserts in sort order, and honors ownership/filters) so it appears without a re-query.
      channelManager.ingestChannel(item);
    },
    [item, openChannel, channelManager, onSelect],
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
  const { channelManager, client, searchController } = useChatContext();
  const { isChannelActive, openChannel } = useWorkspaceNavigation();

  const channel = useMemo(() => {
    const { channel: channelData } = item;
    const type = channelData?.type ?? 'unknown';
    const id = channelData?.id ?? 'unknown';
    return client.channel(type, id);
  }, [client, item]);

  // Active = this result's channel is currently open in the workspace (by identity), not
  // "the first channel slot".
  const channelOpenInSlot = isChannelActive(channel?.cid ?? undefined);

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      if (!channel) return;
      // Setting focusedMessage is enough: the target channel's <Channel> reacts to
      // searchController.focusedMessage and performs the paginator jumpToMessage (loading the
      // window around the target). No manual channel.state preload is needed here.
      searchController._internalState.partialNext({ focusedMessage: item });
      openChannel(channel, { event });
      channelManager.ingestChannel(channel);
    },
    [channel, item, openChannel, searchController, channelManager, onSelect],
  );

  // Preview the matched message itself (not the channel's latest) by overriding `previewedMessage`.
  const previewedMessage = useMemo(() => formatMessage(item), [item]);

  if (!channel) return null;

  return (
    <ChannelListItem
      active={
        !!channelOpenInSlot &&
        item.id === searchController._internalState.getLatestValue().focusedMessage?.id
      }
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
      const newChannel = client.channel(directMessagingChannelType, {
        members: [{ user_id: client.userId as string }, { user_id: item.id }],
      });
      newChannel.watch();
      // Default: open the DM channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` can honor ⌘/ctrl-click.
      openChannel(newChannel, { event });
      channelManager.ingestChannel(newChannel);
    },
    [client, item, openChannel, channelManager, directMessagingChannelType, onSelect],
  );

  return (
    <div className='str-chat__search-result-container'>
      <button
        aria-label={t('aria/Select User Channel: {{ name }}', {
          name: item.name || '',
        })}
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
            timestamp={item.last_active}
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
