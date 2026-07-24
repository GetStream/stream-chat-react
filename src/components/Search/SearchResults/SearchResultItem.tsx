import React, { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import { formatMessage } from 'stream-chat';
import type { Channel, MessageResponse, User } from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { Avatar } from '../../../components/Avatar';
import { ChannelListItem } from '../../../components/ChannelListItem';
import {
  useChatContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';
import { Timestamp } from '../../../components/Message/Timestamp';

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
  const { channelPaginatorsOrchestrator } = useChatContext();

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      // Default: open the channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` (e.g. via ChatView's `deriveWorkspaceNavigation`) can honor ⌘/ctrl-click.
      openChannel(item, { event });
      // Route the channel into the list(s) that should own it (the orchestrator dedupes by cid,
      // inserts in sort order, and honors ownership/filters) so it appears without a re-query.
      channelPaginatorsOrchestrator.ingestChannel(item);
    },
    [item, openChannel, channelPaginatorsOrchestrator, onSelect],
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
  item: MessageResponse;
  /** Overrides selection (see `ChannelSearchResultItem`); when provided it runs instead of the
   *  default (jump to the message and open its channel). */
  onSelect?: (event: React.MouseEvent) => void;
};

export const MessageSearchResultItem = ({
  item,
  onSelect,
}: ChannelByMessageSearchResultItemProps) => {
  const { channelPaginatorsOrchestrator, client, searchController } = useChatContext();
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
      channelPaginatorsOrchestrator.ingestChannel(channel);
    },
    [
      channel,
      item,
      openChannel,
      searchController,
      channelPaginatorsOrchestrator,
      onSelect,
    ],
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
  item: User;
  /** Overrides selection (see `ChannelSearchResultItem`); when provided it runs instead of the
   *  default (open a direct-messaging channel with the user). */
  onSelect?: (event: React.MouseEvent) => void;
};

export const UserSearchResultItem = ({ item, onSelect }: UserSearchResultItemProps) => {
  const { channelPaginatorsOrchestrator, client } = useChatContext();
  const { openChannel } = useWorkspaceNavigation();
  const { directMessagingChannelType } = useSearchContext();
  const { t } = useTranslationContext();

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      const newChannel = client.channel(directMessagingChannelType, {
        members: [client.userID as string, item.id],
      });
      newChannel.watch();
      // Default: open the DM channel in the workspace, forwarding the event so a consumer overriding
      // `openChannel` can honor ⌘/ctrl-click.
      openChannel(newChannel, { event });
      channelPaginatorsOrchestrator.ingestChannel(newChannel);
    },
    [
      client,
      item,
      openChannel,
      channelPaginatorsOrchestrator,
      directMessagingChannelType,
      onSelect,
    ],
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
          imageUrl={item.image}
          isOnline={item.online}
          size='xl'
          userName={item.name || item.id}
        />
        <div className='str-chat__search-result-data'>
          <div className='str-chat__search-result__display-name'>
            {item.name || item.username || item.id}
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
