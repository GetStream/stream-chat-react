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
import { FILE_ATTACHMENT_TYPES, toChannelFileSections } from './ChannelFilesView.utils';

const CHANNEL_FILES_SEARCH_PAGE_SIZE = 30;

const channelFilesSearchSourceStateSelector = (
  state: SearchSourceState<MessageResponse>,
) => ({
  isLoading: state.isLoading,
  messages: state.items,
});

export const useChannelFilesSearch = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();

  const channelFilesSearchSource = useMemo(() => {
    const source = new MessageSearchSource(client, {
      allowEmptySearchString: true,
      pageSize: CHANNEL_FILES_SEARCH_PAGE_SIZE,
      resetOnNewSearchQuery: false,
    });

    source.messageSearchChannelFilters = { cid: channel.cid };
    source.messageSearchFilters = {
      'attachments.type': { $in: [...FILE_ATTACHMENT_TYPES] },
    };

    return source;
  }, [channel.cid, client]);

  const { isLoading, messages } = useStateStore(
    channelFilesSearchSource.state,
    channelFilesSearchSourceStateSelector,
  );

  const { groupCounts, items, sections } = useMemo(
    () =>
      toChannelFileSections((messages ?? []) as Array<MessageResponse | LocalMessage>),
    [messages],
  );

  useEffect(() => {
    channelFilesSearchSource.activate();
    void channelFilesSearchSource.search('');

    return () => {
      channelFilesSearchSource.cancelScheduledQuery();
    };
  }, [channelFilesSearchSource]);

  return {
    channelFilesSearchSource,
    fileItems: items,
    groupCounts,
    hasResultsLoaded: Array.isArray(messages),
    isLoading,
    sections,
  };
};
