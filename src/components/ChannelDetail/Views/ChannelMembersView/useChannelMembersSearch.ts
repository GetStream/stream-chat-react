import {
  type ChannelMemberResponse,
  ChannelMemberSearchSource,
  type SearchSourceState,
} from 'stream-chat';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useStateStore } from '../../../../store';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { CHANNEL_MEMBERS_QUERY_LIMIT } from './ChannelMembersView.utils';

const MEMBERS_SEARCH_DEBOUNCE_MS = 300;

const membersSearchSourceItemsStateSelector = (
  state: SearchSourceState<ChannelMemberResponse>,
) => ({
  members: state.items,
});

export const useChannelMembersSearch = () => {
  const { channel } = useChannelDetailContext();
  const fallbackMembers = useMemo(
    () => Object.values(channel.state?.members ?? {}),
    [channel],
  );
  const membersSearchSource = useMemo(() => {
    const source = new ChannelMemberSearchSource(channel, {
      allowEmptySearchString: true,
      debounceMs: MEMBERS_SEARCH_DEBOUNCE_MS,
      pageSize: CHANNEL_MEMBERS_QUERY_LIMIT,
      resetOnNewSearchQuery: false,
    });

    source.activate();
    return source;
  }, [channel]);
  const { members } = useStateStore(
    membersSearchSource.state,
    membersSearchSourceItemsStateSelector,
  );
  const [searchInputResetKey, setSearchInputResetKey] = useState(0);

  const resetMembersSearch = useCallback(() => {
    membersSearchSource.cancelScheduledQuery();
    setSearchInputResetKey((currentResetKey) => currentResetKey + 1);
    membersSearchSource.resetState();
    membersSearchSource.activate();
    void membersSearchSource.search('');
  }, [membersSearchSource]);

  const handleSearchChange = useCallback(
    (query: string) => {
      membersSearchSource.search(query.trim());
    },
    [membersSearchSource],
  );

  useEffect(() => {
    void membersSearchSource.search('');
  }, [membersSearchSource]);

  useEffect(
    () => () => {
      membersSearchSource.cancelScheduledQuery();
    },
    [membersSearchSource],
  );

  return {
    displayedMembers: members ?? fallbackMembers,
    handleSearchChange,
    membersSearchSource,
    resetMembersSearch,
    searchInputResetKey,
  };
};
