import React, { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import type { Channel, MessageResponse, User } from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { Avatar } from '../../../components/Avatar';
import { ChannelListItem } from '../../../components/ChannelListItem';
import { useSlotForKey } from '../../../components/ChatView';
import { useChatViewNavigation } from '../../../components/ChatView/ChatViewNavigationContext';
import { useChatContext, useTranslationContext } from '../../../context';
import { DEFAULT_JUMP_TO_PAGE_SIZE } from '../../../constants/limits';
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
  const { open } = useChatViewNavigation();
  const { channelPaginatorsOrchestrator } = useChatContext();

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      // Default: open the channel into a layout slot. Slot/UX choices (e.g. ctrl/⌘-click to
      // open beside the current channel) are left to the app via `onSelect`.
      open({ key: item.cid ?? undefined, kind: 'channel', source: item });
      // Route the channel into the list(s) that should own it (the orchestrator dedupes by cid,
      // inserts in sort order, and honors ownership/filters) so it appears without a re-query.
      channelPaginatorsOrchestrator.ingestChannel(item);
    },
    [item, open, channelPaginatorsOrchestrator, onSelect],
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
  const { open } = useChatViewNavigation();

  const channel = useMemo(() => {
    const { channel: channelData } = item;
    const type = channelData?.type ?? 'unknown';
    const id = channelData?.id ?? 'unknown';
    return client.channel(type, id);
  }, [client, item]);

  // Active = this result's channel is currently open in a slot (by identity), not
  // "the first channel slot".
  const channelOpenInSlot = useSlotForKey(channel?.cid ?? undefined);

  const handleSelect = useCallback(
    async (event: React.MouseEvent) => {
      if (onSelect) {
        onSelect(event);
        return;
      }
      if (!channel) return;
      await channel.state.loadMessageIntoState(
        item.id,
        undefined,
        DEFAULT_JUMP_TO_PAGE_SIZE,
      );
      // FIXME: message focus should be handled by yet non-existent msg list controller in client packaged
      searchController._internalState.partialNext({ focusedMessage: item });
      open({ key: channel.cid ?? undefined, kind: 'channel', source: channel });
      channelPaginatorsOrchestrator.ingestChannel(channel);
    },
    [channel, item, open, searchController, channelPaginatorsOrchestrator, onSelect],
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const getLatestMessagePreview = useCallback(() => item.text!, [item]);

  if (!channel) return null;

  return (
    <ChannelListItem
      active={
        !!channelOpenInSlot &&
        item.id === searchController._internalState.getLatestValue().focusedMessage?.id
      }
      channel={channel}
      className='str-chat__search-result'
      getLatestMessagePreview={getLatestMessagePreview}
      onSelect={handleSelect}
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
  const { open } = useChatViewNavigation();
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
      // Default: open the DM channel into a layout slot. ctrl/⌘-click and other slot choices
      // are left to the app via `onSelect`.
      open({ key: newChannel.cid ?? undefined, kind: 'channel', source: newChannel });
      channelPaginatorsOrchestrator.ingestChannel(newChannel);
    },
    [
      client,
      item,
      open,
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
