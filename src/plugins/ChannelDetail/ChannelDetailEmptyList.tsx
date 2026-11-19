import React from 'react';

import { useComponentContextIcons } from '../../context';
import type { PropsWithChildrenOnly } from '../../types/types';

/** The layout of a channel detail view's empty state: the search icon above the text. */
export const ChannelDetailEmptyList = ({ children }: PropsWithChildrenOnly) => {
  const { IconSearch } = useComponentContextIcons();

  return (
    <div className='str-chat__channel-detail__channel-members-view__empty-state'>
      <IconSearch />
      <div>{children}</div>
    </div>
  );
};
