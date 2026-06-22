import {
  type ChannelMemberResponse,
  ChannelMemberSearchSource,
  type SearchSourceState,
} from 'stream-chat';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useStateStore } from '../../../../store';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { CHANNEL_MEMBERS_QUERY_LIMIT } from './ChannelMembersView.utils';
import { useChannelMemberCount } from './useChannelMemberCount';

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
  // never suppress loading on incomplete channel data. The count is tracked
  // reactively so a channel that gains its first member activates the list
  // without a remount.
  const memberCount = useChannelMemberCount(channel);
  const hasMembers = channel.data?.member_count === undefined || memberCount !== 0;
  const membersSearchSource = useMemo(
    () =>
      new ChannelMemberSearchSource(channel, {
        allowEmptySearchString: true,
        debounceMs: MEMBERS_SEARCH_DEBOUNCE_MS,
        pageSize: CHANNEL_MEMBERS_QUERY_LIMIT,
        resetOnNewSearchQuery: false,
      }),
    [channel],
  );
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
    membersSearchSource.activate();
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
