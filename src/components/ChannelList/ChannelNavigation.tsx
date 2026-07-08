import React from 'react';
import type { SearchControllerState } from 'stream-chat';

import { ChannelListHeader } from './ChannelListHeader';
import { ChannelLists } from './ChannelLists';
import { NotificationList as DefaultNotificationList } from '../Notifications';
import { Search as DefaultSearch } from '../Search';
import { useChatContext, useComponentContext } from '../../context';
import { useStateStore } from '../../store';

const searchControllerStateSelector = (state: SearchControllerState) => ({
  isActive: state.isActive,
});

/**
 * Channel navigation region: owns the search-results ↔ channel-list swap so the
 * list components stay pure. Renders the `ChannelListHeader`, then `Search` (bar
 * always; results while active), then the paginator-driven `ChannelLists` only while
 * search is inactive. Mapped to the channel-navigation slot; `Search` is customizable
 * via the `ComponentContext` `Search` slot.
 */
export const ChannelNavigation = () => {
  const { NotificationList = DefaultNotificationList, Search = DefaultSearch } =
    useComponentContext();
  const { searchController } = useChatContext();
  const { isActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  return (
    <div className='str-chat__channel-list'>
      <ChannelListHeader />
      <Search />
      {!isActive && <ChannelLists />}
      <NotificationList panel='channel-list' />
    </div>
  );
};
