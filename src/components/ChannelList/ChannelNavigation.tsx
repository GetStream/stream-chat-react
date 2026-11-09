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
 * Channel navigation region: `ChannelListHeader`, `Search` (the bar always, results while active),
 * `ChannelLists` while search is inactive, and the channel-list `NotificationList`. All but
 * `ChannelLists` are `ComponentContext` slots.
 *
 * Outside `ChatView` the root applies the `str-chat <theme>` scope itself; inside one it inherits
 * `ChatView`'s, since a nested scope would reset overridden design tokens. `customClasses.chat` and
 * `customClasses.channelList` replace the `str-chat` and `str-chat__channel-list` classes.
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
