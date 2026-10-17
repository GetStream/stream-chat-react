import clsx from 'clsx';
import React from 'react';
import type { SearchControllerState } from 'stream-chat';

import { ChannelListHeader as DefaultChannelListHeader } from './ChannelListHeader';
import { ChannelLists } from './ChannelLists';
import { NotificationList as DefaultNotificationList } from '../Notifications';
import { Search as DefaultSearch } from '../Search';
import { useChatContext, useComponentContext } from '../../context';
import {
  ThemeScopeProvider,
  useIsInThemeScope,
  useThemeScopeClassName,
} from '../../context/ThemeScopeContext';
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
 * Outside `ChatView` its root carries the `str-chat <theme>` scope itself, so the design tokens
 * apply; inside one it inherits `ChatView`'s instead of resetting them with a nested scope.
 * `customClasses.chat` / `customClasses.channelList` replace the `str-chat` /
 * `str-chat__channel-list` classes.
 */
export const ChannelNavigation = () => {
  const {
    ChannelListHeader = DefaultChannelListHeader,
    NotificationList = DefaultNotificationList,
    Search = DefaultSearch,
  } = useComponentContext();
  const { customClasses, searchController } = useChatContext();
  const isInThemeScope = useIsInThemeScope();
  const themeScopeClassName = useThemeScopeClassName();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();
  const { isActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  return (
    <div
      className={clsx(
        !isInThemeScope && themeScopeClassName,
        customClasses?.channelList ?? 'str-chat__channel-list',
        windowsEmojiClass,
      )}
    >
      <ThemeScopeProvider>
        <ChannelListHeader />
        <Search />
        {!isActive && <ChannelLists />}
        <NotificationList panel='channel-list' />
      </ThemeScopeProvider>
    </div>
  );
};
