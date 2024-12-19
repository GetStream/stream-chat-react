import uniqBy from 'lodash.uniqby';
import React, { ComponentType, useCallback, useMemo } from 'react';
import { Channel, MessageResponse, User } from 'stream-chat';
import { useSearchContext } from '../SearchContext';
import { Avatar } from '../../../components/Avatar';
import { ChannelPreview } from '../../../components/ChannelPreview';
import { useChannelListContext, useChatContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';
import type {
  DefaultSearchSources,
  InferSearchQueryResult,
  SearchSource,
} from '../SearchController';
import { DEFAULT_JUMP_TO_PAGE_SIZE } from '../../../constants/limits';

export type ChannelSearchResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  item: Channel<StreamChatGenerics>;
};

export const ChannelSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  item,
}: ChannelSearchResultItemProps<StreamChatGenerics>) => {
  const { setActiveChannel } = useChatContext<StreamChatGenerics>();
  const { setChannels } = useChannelListContext<StreamChatGenerics>();

  const onSelect = useCallback(() => {
    setActiveChannel(item);
    setChannels?.((channels) => uniqBy([item, ...channels], 'cid'));
  }, [item, setActiveChannel, setChannels]);

  return <ChannelPreview channel={item} className='str-chat__search-result' onSelect={onSelect} />;
};

export type ChannelByMessageSearchResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  item: MessageResponse<StreamChatGenerics>;
};

export const MessageSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  item,
}: ChannelByMessageSearchResultItemProps<StreamChatGenerics>) => {
  const { client, searchController } = useChatContext<StreamChatGenerics, SearchSources>();
  const { channel: activeChannel, setActiveChannel } = useChatContext<StreamChatGenerics>();
  const { setChannels } = useChannelListContext<StreamChatGenerics>();

  const channel = useMemo(() => {
    const { channel: channelData } = item;
    const type = channelData?.type ?? 'unknown';
    const id = channelData?.id ?? 'unknown';
    return client.channel(type, id);
  }, [client, item]);

  const onSelect = useCallback(async () => {
    if (!channel) return;
    await channel.state.loadMessageIntoState(item.id, undefined, DEFAULT_JUMP_TO_PAGE_SIZE);
    // FIXME: message focus should be handled by yet non-existent msg list controller in client packaged
    searchController.state.partialNext({ focusedMessage: item });
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
        item.id === searchController.state.getLatestValue().focusedMessage?.id
      }
      channel={channel}
      className='str-chat__search-result'
      getLatestMessagePreview={getLatestMessagePreview}
      onSelect={onSelect}
    />
  );
};

export type UserSearchResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  item: User<StreamChatGenerics>;
};

export const UserSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources
>({
  item,
}: UserSearchResultItemProps<StreamChatGenerics>) => {
  const { client, setActiveChannel } = useChatContext<StreamChatGenerics>();
  const { setChannels } = useChannelListContext<StreamChatGenerics>();
  const { userToUserCreatedChannelType } = useSearchContext<StreamChatGenerics, Sources>();

  const onClick = useCallback(() => {
    const newChannel = client.channel(userToUserCreatedChannelType, {
      members: [client.userID as string, item.id],
    });
    newChannel.watch();
    setActiveChannel(newChannel);
    setChannels?.((channels) => uniqBy([newChannel, ...channels], 'cid'));
  }, [client, item, setActiveChannel, setChannels, userToUserCreatedChannelType]);

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
        image={item.image}
        name={item.name || item.id}
        user={item}
      />
      <div className='str-chat__search-result--display-name'>{item.name || item.id}</div>
    </button>
  );
};

export type SearchResultItemComponents<Sources extends SearchSource[] = DefaultSearchSources> = {
  [K in Sources[number]['type']]?: ComponentType<{
    item: InferSearchQueryResult<Extract<Sources[number], { type: K }>>;
  }>;
};

export const DefaultSearchResultItems: SearchResultItemComponents = {
  channels: ChannelSearchResultItem,
  messages: MessageSearchResultItem,
  users: UserSearchResultItem,
};
