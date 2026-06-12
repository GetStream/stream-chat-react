import {
  type LocalMessage,
  type MessageResponse,
  MessageSearchSource,
  type SearchSourceState,
} from 'stream-chat';
import { useEffect, useMemo } from 'react';

import { useChatContext } from '../../../../context';
import { useStateStore } from '../../../../store';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { MEDIA_ATTACHMENT_TYPES, toChannelMediaItems } from './ChannelMediaView.utils';

const CHANNEL_MEDIA_SEARCH_PAGE_SIZE = 30;

const channelMediaSearchSourceItemsStateSelector = (
  state: SearchSourceState<MessageResponse>,
) => ({
  isLoading: state.isLoading,
  messages: state.items,
});

export const useChannelMediaSearch = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();

  const channelMediaSearchSource = useMemo(() => {
    const source = new MessageSearchSource(client, {
      allowEmptySearchString: true,
      pageSize: CHANNEL_MEDIA_SEARCH_PAGE_SIZE,
      resetOnNewSearchQuery: false,
    });

    source.messageSearchChannelFilters = { cid: channel.cid };
    source.messageSearchFilters = {
      'attachments.type': { $in: [...MEDIA_ATTACHMENT_TYPES] },
    };
    source.activate();

    return source;
  }, [channel.cid, client]);

  const { isLoading, messages } = useStateStore(
    channelMediaSearchSource.state,
    channelMediaSearchSourceItemsStateSelector,
  );

  const mediaItems = useMemo(
    () => toChannelMediaItems((messages ?? []) as Array<MessageResponse | LocalMessage>),
    [messages],
  );

  useEffect(
    () => () => {
      channelMediaSearchSource.cancelScheduledQuery();
    },
    [channelMediaSearchSource],
  );

  return {
    channelMediaSearchSource,
    hasResultsLoaded: Array.isArray(messages),
    isLoading,
    mediaItems,
  };
};
