import uniqBy from 'lodash.uniqby';
import React, { ComponentType, useCallback, useMemo } from 'react';
import { Channel, MessageResponse, User } from 'stream-chat';
import { Avatar } from '../../Avatar';
import { ChannelPreview, ChannelPreviewMessenger } from '../../ChannelPreview';
import { useChannelListContext, useChatContext, useSearchContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';
import type {
  DefaultSearchSources,
  InferSearchQueryResult,
  SearchSource,
} from '../SearchController';

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

  return (
    <ChannelPreview
      channel={item}
      className='str-chat__channel-search-result'
      onSelect={onSelect}
    />
  );
};

export type ChannelByMessageSearchResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  item: MessageResponse<StreamChatGenerics>;
};

export const MessageSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  item,
}: ChannelByMessageSearchResultItemProps<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { setActiveChannel } = useChatContext<StreamChatGenerics>();
  const { setChannels } = useChannelListContext<StreamChatGenerics>();

  const channel = useMemo(() => {
    const { channel: channelData } = item;
    if (!channelData) return;
    return client.channel(channelData.type, channelData.id);
  }, [client, item]);

  const onSelect = useCallback(() => {
    if (!channel) return;

    setActiveChannel(channel);
    setChannels?.((channels) => uniqBy([channel, ...channels], 'cid'));
    // todo: jumpToMessage
  }, [channel, setActiveChannel, setChannels]);

  if (!channel) return;

  return (
    <ChannelPreviewMessenger
      channel={channel}
      className='str-chat__channel-search-result'
      latestMessagePreview={item.text}
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
  const { userToUserCreatedChannelType } = useSearchContext<Sources>();

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
      className='str-chat__channel-search-result'
      data-testid='channel-search-result-user'
      onClick={onClick}
      role='option'
    >
      <Avatar
        className='str-chat__avatar--channel-preview'
        image={item.image}
        name={item.name || item.id}
        user={item}
      />
      <div className='str-chat__channel-search-result--display-name'>{item.name || item.id}</div>
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
