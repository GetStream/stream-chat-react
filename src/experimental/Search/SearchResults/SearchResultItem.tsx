import React, { useCallback, useMemo } from 'react';
import uniqBy from 'lodash.uniqby';
import type { ComponentType } from 'react';
import type { Channel, MessageResponse, User } from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { Avatar } from '../../../components/Avatar';
import { ChannelPreview } from '../../../components/ChannelPreview';
import { useChannelListContext, useChatContext } from '../../../context';
import { DEFAULT_JUMP_TO_PAGE_SIZE } from '../../../constants/limits';

export type ChannelSearchResultItemProps = {
  item: Channel;
};

export const ChannelSearchResultItem = ({ item }: ChannelSearchResultItemProps) => {
  const { setActiveChannel } = useChatContext();
  const { setChannels } = useChannelListContext();

  const onSelect = useCallback(() => {
    setActiveChannel(item);
    setChannels?.((channels) => uniqBy([item, ...channels], 'cid'));
  }, [item, setActiveChannel, setChannels]);

  return (
    <ChannelPreview
      channel={item}
      className='str-chat__search-result'
      onSelect={onSelect}
    />
  );
};

export type ChannelByMessageSearchResultItemProps = {
  item: MessageResponse;
};

export const MessageSearchResultItem = ({
  item,
}: ChannelByMessageSearchResultItemProps) => {
  const {
    channel: activeChannel,
    client,
    searchController,
    setActiveChannel,
  } = useChatContext();
  const { setChannels } = useChannelListContext();

  const channel = useMemo(() => {
    const { channel: channelData } = item;
    const type = channelData?.type ?? 'unknown';
    const id = channelData?.id ?? 'unknown';
    return client.channel(type, id);
  }, [client, item]);

  const onSelect = useCallback(async () => {
    if (!channel) return;
    await channel.state.loadMessageIntoState(
      item.id,
      undefined,
      DEFAULT_JUMP_TO_PAGE_SIZE,
    );
    // FIXME: message focus should be handled by yet non-existent msg list controller in client packaged
    searchController._internalState.partialNext({ focusedMessage: item });
    setActiveChannel(channel);
    setChannels?.((channels) => uniqBy([channel, ...channels], 'cid'));
  }, [channel, item, searchController, setActiveChannel, setChannels]);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const getLatestMessagePreview = useCallback(() => item.text!, [item]);

  if (!channel) return;

  return (
    <ChannelPreview
      active={
        channel.cid === activeChannel?.cid &&
        item.id === searchController._internalState.getLatestValue().focusedMessage?.id
      }
      channel={channel}
      className='str-chat__search-result'
      getLatestMessagePreview={getLatestMessagePreview}
      onSelect={onSelect}
    />
  );
};

export type UserSearchResultItemProps = {
  item: User;
};

export const UserSearchResultItem = ({ item }: UserSearchResultItemProps) => {
  const { client, setActiveChannel } = useChatContext();
  const { setChannels } = useChannelListContext();
  const { directMessagingChannelType } = useSearchContext();

  const onClick = useCallback(() => {
    const newChannel = client.channel(directMessagingChannelType, {
      members: [client.userID as string, item.id],
    });
    newChannel.watch();
    setActiveChannel(newChannel);
    setChannels?.((channels) => uniqBy([newChannel, ...channels], 'cid'));
  }, [client, item, setActiveChannel, setChannels, directMessagingChannelType]);

  return (
    <button
      aria-label={`Select User Channel: ${item.name || ''}`}
      className='str-chat__search-result'
      data-testid='search-result-user'
      onClick={onClick}
      role='option'
    >
      <Avatar
        className='str-chat__avatar--channel-preview'
        imageUrl={item.image}
        size='md'
        userName={item.name || item.id}
      />
      <div className='str-chat__search-result--display-name'>{item.name || item.id}</div>
    </button>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchResultItemComponents = Record<string, ComponentType<{ item: any }>>;

export const DefaultSearchResultItems: SearchResultItemComponents = {
  channels: ChannelSearchResultItem,
  messages: MessageSearchResultItem,
  users: UserSearchResultItem,
};
