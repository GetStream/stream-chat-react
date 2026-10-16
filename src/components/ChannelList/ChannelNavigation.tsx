import clsx from 'clsx';
import React from 'react';
import type { SearchControllerState } from 'stream-chat';

import { ChannelListHeader as DefaultChannelListHeader } from './ChannelListHeader';
import { ChannelLists } from './ChannelLists';
import { NotificationList as DefaultNotificationList } from '../Notifications';
import { Search as DefaultSearch } from '../Search';
import { useChatContext, useComponentContext } from '../../context';
import { useImageFlagEmojisOnWindowsClass } from '../Channel/hooks/useChannelContainerClasses';
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
 *
 * Its root carries the `str-chat` theme scope itself (like `Channel`), so the design tokens apply
 * when it is rendered outside `ChatView`. `customClasses.chat` / `customClasses.channelList`
 * replace the `str-chat` / `str-chat__channel-list` classes.
 */
export const ChannelNavigation = () => {
  const {
    ChannelListHeader = DefaultChannelListHeader,
    NotificationList = DefaultNotificationList,
    Search = DefaultSearch,
  } = useComponentContext();
  const { customClasses, searchController, theme } = useChatContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();
  const { isActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  return (
    <div
      className={clsx(
        customClasses?.chat ?? 'str-chat',
        theme,
        customClasses?.channelList ?? 'str-chat__channel-list',
        windowsEmojiClass,
      )}
    >
      <ChannelListHeader />
      <Search />
      {!isActive && <ChannelLists />}
      <NotificationList panel='channel-list' />
    </div>
  );
};
