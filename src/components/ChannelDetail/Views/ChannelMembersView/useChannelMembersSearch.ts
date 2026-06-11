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
  // Skip activating/searching only when the server explicitly reports zero
  // members. `member_count` being undefined is treated as "has members" so we
  // never suppress loading on incomplete channel data.
  const hasMembers = channel.data?.member_count !== 0;
  const membersSearchSource = useMemo(() => {
    const source = new ChannelMemberSearchSource(channel, {
      allowEmptySearchString: true,
      debounceMs: MEMBERS_SEARCH_DEBOUNCE_MS,
      pageSize: CHANNEL_MEMBERS_QUERY_LIMIT,
      resetOnNewSearchQuery: false,
    });

    if (hasMembers) source.activate();
    return source;
  }, [channel, hasMembers]);
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
    if (!hasMembers) return;
    void membersSearchSource.search('');
  }, [hasMembers, membersSearchSource]);

  useEffect(
    () => () => {
      membersSearchSource.cancelScheduledQuery();
    },
    [membersSearchSource],
  );

  return {
    displayedMembers: members ?? fallbackMembers,
    handleSearchChange,
    hasMembers,
    membersSearchSource,
    resetMembersSearch,
    searchInputResetKey,
  };
};
